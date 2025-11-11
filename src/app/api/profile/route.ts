import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import formidable, { type File as FormidableFile } from 'formidable';
import { InputFile } from 'node-appwrite/file';
import { ID, Query } from '@/lib/appwrite/sdk';
import { serverConfig } from '@/lib/config/server';
import {
  getProfileDatabases,
  getProfileEnv,
  getProfileStorage,
  getProfileUsers,
  type ProfileDocument,
} from '@/lib/appwrite/profileServer';
import { AppwriteAuthError, verifyAppwriteRequest } from '@/lib/appwrite/verifyRequest';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MiB
const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

interface ProfilePatchPayload {
  displayName?: string;
  username?: string;
  bio?: string;
  disabled?: boolean;
}

interface ParsedMultipart {
  fields: Record<string, string | string[]>;
  files: Record<string, FormidableFile[]>;
}

const REQUIRED_PROFILE_CONFIG: Array<[keyof typeof serverConfig.appwrite, string]> = [
  ['endpoint', 'APPWRITE_ENDPOINT'],
  ['projectId', 'APPWRITE_PROJECT_ID'],
  ['apiKey', 'APPWRITE_API_KEY'],
  ['databaseId', 'APPWRITE_DATABASE_ID'],
  ['profilesCollectionId', 'APPWRITE_PROFILES_COLLECTION_ID'],
  ['avatarBucketId', 'APPWRITE_AVATAR_BUCKET_ID'],
];

function findMissingProfileConfig(): string[] {
  return REQUIRED_PROFILE_CONFIG.filter(([key]) => {
    const value = serverConfig.appwrite[key];
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    return !value;
  }).map(([, envName]) => envName);
}

async function parseMultipart(req: NextRequest): Promise<ParsedMultipart> {
    const form = formidable({ multiples: false, maxFileSize: MAX_AVATAR_SIZE });

    // Convert NextRequest to a Node.js-like request object for formidable
    const formidableReq = {
        ...req,
        headers: Object.fromEntries(req.headers),
        // @ts-expect-error Formidable expects a Node.js request object
        [Symbol.asyncIterator]: req.body?.[Symbol.asyncIterator].bind(req.body),
    };

    // @ts-expect-error Formidable expects a Node.js request object
    const [fields, files] = await form.parse(formidableReq);

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

async function ensureUsernameUnique(username: string, currentId: string) {
  const env = getProfileEnv();
  const databases = getProfileDatabases();
  const normalised = username.toLowerCase();
  const result = await databases.listDocuments<ProfileDocument>(
    env.databaseId,
    env.profilesCollectionId,
    [Query.equal('username', normalised), Query.notEqual('$id', currentId)]
  );

  if (result.total > 0) {
    throw new Error('Username is already taken');
  }
}

async function uploadAvatar(file: FormidableFile, previousFileId?: string | null) {
  const env = getProfileEnv();
  const storage = getProfileStorage();
  const buffer = await fs.readFile(file.filepath);
  const inputFile = InputFile.fromBuffer(buffer, file.originalFilename ?? 'avatar');
  const created = await storage.createFile(
    env.avatarBucketId,
    ID.unique(),
    inputFile as Parameters<(typeof storage)['createFile']>[2]
  );

  if (previousFileId) {
    try {
      await storage.deleteFile(env.avatarBucketId, previousFileId);
    } catch (error) {
      console.warn('Failed to delete previous avatar file', previousFileId, error);
    }
  }

  const avatarUrl = storage.getFileView(env.avatarBucketId, created.$id).toString();
  return {
    avatarFileId: created.$id,
    avatarUrl,
  };
}

async function readExistingProfile(userId: string) {
  const env = getProfileEnv();
  const databases = getProfileDatabases();
  return databases.getDocument<ProfileDocument>(env.databaseId, env.profilesCollectionId, userId);
}

async function updateProfileDocument(
  userId: string,
  patch: ProfilePatchPayload & { avatarFileId?: string; avatarUrl?: string }
) {
  const env = getProfileEnv();
  const databases = getProfileDatabases();

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { updatedAt: now };

  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  return databases.updateDocument<ProfileDocument>(
    env.databaseId,
    env.profilesCollectionId,
    userId,
    payload
  );
}

async function updateAccountDisplayName(userId: string, displayName?: string) {
  if (!displayName) return;
  const users = getProfileUsers();
  await users.updateName(userId, displayName);
}

async function handleGet(userId: string) {
  try {
    const profile = await readExistingProfile(userId);
    return NextResponse.json({ ok: true, data: profile });
  } catch (error) {
    console.error('Failed to load profile', error);
    return NextResponse.json({ error: 'profile-not-found', reason: 'Profile not found' }, { status: 404 });
  }
}

async function handlePatch(req: NextRequest, userId: string) {
  try {
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

    if (patch.username) {
      patch.username = patch.username.trim().toLowerCase();
    }

    if (patch.username && patch.username !== existingProfile.username) {
      await ensureUsernameUnique(patch.username, existingProfile.$id);
    }

    const avatarFile = files.avatar?.[0];
    let avatarUpdates: { avatarFileId?: string; avatarUrl?: string } = {};
    if (avatarFile) {
      assertAvatarFile(avatarFile);
      avatarUpdates = await uploadAvatar(avatarFile, existingProfile.avatarFileId ?? null);
    }

    const updated = await updateProfileDocument(userId, { ...patch, ...avatarUpdates });

    if (patch.displayName && patch.displayName !== existingProfile.displayName) {
      await updateAccountDisplayName(userId, patch.displayName);
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('Profile update failed', error);
    const errorMessage = error instanceof Error ? error.message : 'unknown-error';
    return NextResponse.json({
      error: 'profile-update-failed',
      reason: errorMessage,
    }, { status: 400 });
  }
}

async function handler(req: NextRequest) {
    try {
        const missingConfig = findMissingProfileConfig();
        if (missingConfig.length > 0) {
        return NextResponse.json({
            error: 'profile-service-unavailable',
            reason: `Missing required Appwrite configuration: ${missingConfig.join(', ')}`,
            missing: missingConfig,
        }, { status: 503 });
        }

        const session = await verifyAppwriteRequest(req);

        if (req.method === 'GET') {
            return handleGet(session.userId);
        }

        if (req.method === 'PATCH') {
            return handlePatch(req, session.userId);
        }

        return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET,PATCH' } });
    } catch (error) {
        if (error instanceof AppwriteAuthError) {
        return NextResponse.json({ error: 'unauthorized', reason: error.message }, { status: error.status });
        }

        console.error('Profile handler unexpected failure', error);
        return NextResponse.json({ error: 'internal-error', reason: 'Unexpected server error' }, { status: 500 });
    }
}

export { handler as GET, handler as PATCH };
