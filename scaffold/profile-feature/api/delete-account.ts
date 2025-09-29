import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ID, Query } from 'node-appwrite';
import { getDatabases, getEnv, getStorage, getUsers, type ProfileDoc } from './appwriteClient.js';

interface DeleteAccountPayload {
  mode?: 'anonymize' | 'delete';
  confirmation?: boolean;
  gracePeriodDays?: number;
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getAuthUserId(req: IncomingMessage): string | null {
  const header = req.headers['x-appwrite-userid'] || req.headers['x-appwrite-user-id'];
  if (Array.isArray(header)) return header[0] ?? null;
  return header ?? null;
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw) as T;
}

async function loadProfile(userId: string): Promise<ProfileDoc> {
  const env = getEnv();
  const databases = getDatabases();
  return databases.getDocument<ProfileDoc>(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROFILES_COLLECTION_ID,
    userId
  );
}

async function anonymizeProfile(profile: ProfileDoc) {
  const env = getEnv();
  const databases = getDatabases();
  const storage = getStorage();

  const pseudonym = `deleted_user_${crypto.randomBytes(4).toString('hex')}`;
  const updates = {
    displayName: 'Deleted User',
    username: pseudonym,
    bio: '',
    avatarFileId: null,
    avatarUrl: null,
    userId: null, // TODO: decide whether to retain hashed user reference for auditing
    updatedAt: new Date().toISOString(),
  };

  if (profile.avatarFileId) {
    try {
      await storage.deleteFile(env.APPWRITE_AVATAR_BUCKET_ID, profile.avatarFileId);
    } catch (error) {
      console.warn('Failed to delete avatar during anonymization', error);
    }
  }

  await databases.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROFILES_COLLECTION_ID,
    profile.$id,
    updates
  );
  await reassignPrompts(profile.userId, pseudonym);

  return pseudonym;
}

async function deleteProfile(profile: ProfileDoc) {
  const env = getEnv();
  const databases = getDatabases();
  const storage = getStorage();
  const users = getUsers();

  if (profile.avatarFileId) {
    try {
      await storage.deleteFile(env.APPWRITE_AVATAR_BUCKET_ID, profile.avatarFileId);
    } catch (error) {
      console.warn('Failed to delete avatar during account deletion', error);
    }
  }

  await databases.deleteDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROFILES_COLLECTION_ID,
    profile.$id
  );
  await users.delete(profile.userId);
  await removeOrReassignPrompts(profile.userId);
}

async function logGdprAction(userId: string, mode: 'anonymize' | 'delete', req: IncomingMessage) {
  const env = getEnv();
  if (!env.APPWRITE_GDPR_LOGS_COLLECTION_ID) {
    return;
  }

  const databases = getDatabases();
  await databases.createDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_GDPR_LOGS_COLLECTION_ID,
    ID.unique(),
    {
      userId,
      action: mode,
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.headers['x-forwarded-for'] ?? null,
      occurredAt: new Date().toISOString(),
    }
  );
}

async function reassignPrompts(previousOwnerId: string, newOwner: string) {
  const env = getEnv();
  if (!env.APPWRITE_PROMPTS_COLLECTION_ID) {
    console.info('Prompt reassignment skipped; APPWRITE_PROMPTS_COLLECTION_ID not set.');
    return;
  }

  const databases = getDatabases();
  const result = await databases.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROMPTS_COLLECTION_ID,
    [Query.equal('ownerId', previousOwnerId)]
  );

  for (const prompt of result.documents) {
    // TODO: wire prompt ownership field names to your schema
    await databases.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PROMPTS_COLLECTION_ID,
      prompt.$id,
      {
        ownerId: newOwner,
        updatedAt: new Date().toISOString(),
      }
    );
  }
}

async function removeOrReassignPrompts(previousOwnerId: string) {
  const env = getEnv();
  if (!env.APPWRITE_PROMPTS_COLLECTION_ID) {
    console.info('Prompt cleanup skipped; APPWRITE_PROMPTS_COLLECTION_ID not set.');
    return;
  }

  const databases = getDatabases();
  const result = await databases.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_PROMPTS_COLLECTION_ID,
    [Query.equal('ownerId', previousOwnerId)]
  );

  for (const prompt of result.documents) {
    // TODO: Decide whether to delete or transfer ownership to a system account.
    await databases.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PROMPTS_COLLECTION_ID,
      prompt.$id,
      {
        ownerId: null,
        updatedAt: new Date().toISOString(),
      }
    );
  }
}

export async function deleteAccountHandler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const userId = getAuthUserId(req);
  if (!userId) {
    sendJson(res, 401, { error: 'Unauthorized', reason: 'missing-user-id' });
    return;
  }

  try {
    const payload = await readJsonBody<DeleteAccountPayload>(req);

    if (!payload.confirmation) {
      throw new Error('Confirmation checkbox must be accepted');
    }

    if (!payload.mode) {
      throw new Error('Missing account action mode');
    }

    const profile = await loadProfile(userId);

    if (payload.mode === 'anonymize') {
      const pseudonym = await anonymizeProfile(profile);
      await logGdprAction(userId, 'anonymize', req);
      sendJson(res, 200, {
        ok: true,
        mode: 'anonymize',
        pseudonym,
      });
      return;
    }

    if (payload.mode === 'delete') {
      if (payload.gracePeriodDays && payload.gracePeriodDays > 0) {
        // TODO: Implement grace period scheduling (queue job / cron) before hard delete.
        console.warn(
          'Grace period requested but scheduler not implemented. Delete executes immediately.'
        );
      }

      await deleteProfile(profile);
      await logGdprAction(userId, 'delete', req);
      sendJson(res, 200, {
        ok: true,
        mode: 'delete',
      });
      return;
    }

    throw new Error(`Unsupported mode: ${payload.mode}`);
  } catch (error) {
    console.error('Account deletion request failed', error);
    sendJson(res, 400, {
      error: 'account-action-failed',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
}
