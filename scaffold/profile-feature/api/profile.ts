import fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import formidable from 'formidable';
import type { File as FormidableFile } from 'formidable';
import { ID, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import {
  getAppwriteClient,
  getDatabases,
  getEnv,
  getStorage,
  getUsers,
  type ProfileDoc,
} from './appwriteClient.js';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MiB
const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface ProfilePatchPayload {
  displayName?: string;
  username?: string;
  bio?: string;
  disabled?: boolean;
}

interface MultipartResult {
  fields: Record<string, string | string[]>;
  files: Record<string, FormidableFile[]>;
}

function getAuthUserId(req: IncomingMessage): string | null {
  const header = req.headers['x-appwrite-userid'] || req.headers['x-appwrite-user-id'];
  if (Array.isArray(header)) return header[0] ?? null;
  return header ?? null;
}

async function parseMultipart(req: IncomingMessage): Promise<MultipartResult> {
  const form = formidable({ multiples: false, maxFileSize: MAX_AVATAR_SIZE });
  const [fields, files] = await form.parse(req);
  return {
    fields: Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(String) : String(value),
      ])
    ),
    files: Object.fromEntries(
      Object.entries(files).map(([key, value]) => [key, Array.isArray(value) ? value : [value]])
    ),
  };
}

function normaliseBoolean(value: string | boolean | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  const lowered = value.toLowerCase();
  if (['true', '1', 'on', 'yes'].includes(lowered)) return true;
  if (['false', '0', 'off', 'no'].includes(lowered)) return false;
  return undefined;
}

function assertAvatarFile(file?: FormidableFile) {
  if (!file) return;
  if (!SUPPORTED_AVATAR_TYPES.includes(file.mimetype ?? '')) {
    throw new Error('Unsupported avatar file type');
  }
  if ((file.size ?? 0) > MAX_AVATAR_SIZE) {
    throw new Error('Avatar file exceeds maximum size');
  }
}

async function assertUsernameUnique(username: string, currentDocId: string) {
  const env = getEnv();
  const databases = getDatabases();
  const result = await databases.listDocuments<ProfileDoc>(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROFILES_COLLECTION_ID,
    [Query.equal('username', username), Query.notEqual('$id', currentDocId)]
  );
  if (result.total > 0) {
    throw new Error('Username is already taken');
  }
}

async function uploadAvatar(file: FormidableFile, previousFileId?: string | null) {
  const env = getEnv();
  const storage = getStorage();
  const buffer = await fs.readFile(file.filepath);
  const inputFile = InputFile.fromBuffer(buffer, file.originalFilename ?? 'avatar');
  const created = await storage.createFile(
    env.APPWRITE_AVATAR_BUCKET_ID,
    ID.unique(),
    inputFile as Parameters<(typeof storage)['createFile']>[2]
  );

  if (previousFileId) {
    try {
      await storage.deleteFile(env.APPWRITE_AVATAR_BUCKET_ID, previousFileId);
    } catch (error) {
      console.warn('Failed to delete previous avatar file', previousFileId, error);
    }
  }

  const avatarUrl = storage.getFileView(env.APPWRITE_AVATAR_BUCKET_ID, created.$id).toString();
  return {
    avatarFileId: created.$id,
    avatarUrl,
  };
}

async function updateProfileDocument(
  userId: string,
  patch: ProfilePatchPayload & { avatarFileId?: string; avatarUrl?: string }
): Promise<ProfileDoc> {
  const env = getEnv();
  const databases = getDatabases();

  const now = new Date().toISOString();
  const data: Record<string, unknown> = {
    ...patch,
    updatedAt: now,
  };

  const profile = await databases.updateDocument<ProfileDoc>(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROFILES_COLLECTION_ID,
    userId,
    data
  );

  return profile;
}

async function updateAppwriteAccount(userId: string, displayName?: string) {
  if (!displayName) return;
  const users = getUsers();
  await users.updateName(userId, displayName);
}

async function readExistingProfile(userId: string): Promise<ProfileDoc> {
  const env = getEnv();
  const databases = getDatabases();
  return databases.getDocument<ProfileDoc>(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROFILES_COLLECTION_ID,
    userId
  );
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export async function patchProfileHandler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'PATCH') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const userId = getAuthUserId(req);
  if (!userId) {
    sendJson(res, 401, { error: 'Unauthorized', reason: 'missing-user-id' });
    return;
  }

  try {
    await getAppwriteClient(); // warm connection, throws if env invalid

    const { fields, files } = await parseMultipart(req);
    const patch: ProfilePatchPayload = {
      displayName: typeof fields.displayName === 'string' ? fields.displayName : undefined,
      username: typeof fields.username === 'string' ? fields.username : undefined,
      bio: typeof fields.bio === 'string' ? fields.bio : undefined,
      disabled: normaliseBoolean(
        typeof fields.disabled === 'string'
          ? fields.disabled
          : Array.isArray(fields.disabled)
            ? fields.disabled[0]
            : undefined
      ),
    };

    if (patch.displayName && patch.displayName.length > 120) {
      throw new Error('Display name exceeds 120 characters');
    }
    if (patch.username && patch.username.length > 64) {
      throw new Error('Username exceeds 64 characters');
    }
    if (patch.bio && patch.bio.length > 1024) {
      throw new Error('Bio exceeds 1024 characters');
    }

    const existingProfile = await readExistingProfile(userId);

    if (patch.username && patch.username !== existingProfile.username) {
      await assertUsernameUnique(patch.username, existingProfile.$id);
    }

    const avatarFile = files.avatar?.[0];
    let avatarUpdates: { avatarFileId?: string; avatarUrl?: string } = {};
    if (avatarFile) {
      assertAvatarFile(avatarFile);
      avatarUpdates = await uploadAvatar(avatarFile, existingProfile.avatarFileId ?? null);
    }

    const updatedProfile = await updateProfileDocument(userId, {
      ...patch,
      ...avatarUpdates,
    });

    if (patch.displayName && patch.displayName !== existingProfile.displayName) {
      await updateAppwriteAccount(userId, patch.displayName);
    }

    sendJson(res, 200, { ok: true, data: updatedProfile });
  } catch (error) {
    console.error('Profile patch failed', error);
    sendJson(res, 400, {
      error: 'profile-update-failed',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
