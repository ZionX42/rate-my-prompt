import crypto from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ID, Query } from '@/lib/appwrite/sdk';
import {
  getProfileDatabases,
  getProfileEnv,
  getProfileStorage,
  getProfileUsers,
  type ProfileDocument,
} from '@/lib/appwrite/profileServer';
import { AppwriteAuthError, verifyAppwriteRequest } from '@/lib/appwrite/verifyRequest';

interface DeleteAccountPayload {
  mode?: 'anonymize' | 'delete';
  confirmation?: boolean;
  gracePeriodDays?: number;
}

async function loadProfile(userId: string) {
  const env = getProfileEnv();
  const databases = getProfileDatabases();
  return databases.getDocument<ProfileDocument>(env.databaseId, env.profilesCollectionId, userId);
}

async function anonymizeProfile(profile: ProfileDocument) {
  const env = getProfileEnv();
  const databases = getProfileDatabases();
  const storage = getProfileStorage();

  const pseudonym = `deleted_user_${crypto.randomBytes(4).toString('hex')}`;
  const updates = {
    displayName: 'Deleted User',
    username: pseudonym,
    bio: '',
    avatarFileId: null,
    avatarUrl: null,
    userId: null,
    updatedAt: new Date().toISOString(),
  };

  if (profile.avatarFileId) {
    try {
      await storage.deleteFile(env.avatarBucketId, profile.avatarFileId);
    } catch (error) {
      console.warn('Failed to delete avatar during anonymization', error);
    }
  }

  await databases.updateDocument(env.databaseId, env.profilesCollectionId, profile.$id, updates);
  if (profile.userId) {
    await reassignPrompts(profile.userId, pseudonym);
  }

  return pseudonym;
}

async function deleteProfile(profile: ProfileDocument) {
  const env = getProfileEnv();
  const databases = getProfileDatabases();
  const storage = getProfileStorage();
  const users = getProfileUsers();

  if (profile.avatarFileId) {
    try {
      await storage.deleteFile(env.avatarBucketId, profile.avatarFileId);
    } catch (error) {
      console.warn('Failed to delete avatar during account deletion', error);
    }
  }

  await databases.deleteDocument(env.databaseId, env.profilesCollectionId, profile.$id);
  const ownerId = profile.userId ?? profile.$id;
  await users.delete(ownerId);
  await removeOrReassignPrompts(ownerId);
}

async function logGdprAction(req: NextApiRequest, userId: string, mode: 'anonymize' | 'delete') {
  const env = getProfileEnv();
  if (!env.gdprLogsCollectionId) {
    return;
  }

  const databases = getProfileDatabases();
  await databases.createDocument(env.databaseId, env.gdprLogsCollectionId, ID.unique(), {
    userId,
    action: mode,
    userAgent: req.headers['user-agent'] ?? null,
    ip: req.headers['x-forwarded-for'] ?? null,
    occurredAt: new Date().toISOString(),
  });
}

async function reassignPrompts(previousOwnerId: string, newOwner: string) {
  const env = getProfileEnv();
  if (!env.promptsCollectionId) {
    console.info('Prompt reassignment skipped; APPWRITE_PROMPTS_COLLECTION_ID not set.');
    return;
  }

  const databases = getProfileDatabases();
  const result = await databases.listDocuments(env.databaseId, env.promptsCollectionId, [
    Query.equal('ownerId', previousOwnerId),
  ]);

  for (const prompt of result.documents) {
    await databases.updateDocument(env.databaseId, env.promptsCollectionId, prompt.$id, {
      ownerId: newOwner,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function removeOrReassignPrompts(previousOwnerId: string) {
  const env = getProfileEnv();
  if (!env.promptsCollectionId) {
    console.info('Prompt cleanup skipped; APPWRITE_PROMPTS_COLLECTION_ID not set.');
    return;
  }

  const databases = getProfileDatabases();
  const result = await databases.listDocuments(env.databaseId, env.promptsCollectionId, [
    Query.equal('ownerId', previousOwnerId),
  ]);

  for (const prompt of result.documents) {
    await databases.updateDocument(env.databaseId, env.promptsCollectionId, prompt.$id, {
      ownerId: null,
      updatedAt: new Date().toISOString(),
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const session = await verifyAppwriteRequest(req);
    const payload = (req.body ?? {}) as DeleteAccountPayload;

    if (!payload.confirmation) {
      throw new Error('Confirmation checkbox must be accepted');
    }

    if (!payload.mode) {
      throw new Error('Missing account action mode');
    }

    const profile = await loadProfile(session.userId);

    if (payload.mode === 'anonymize') {
      const pseudonym = await anonymizeProfile(profile);
      await logGdprAction(req, session.userId, 'anonymize');
      res.status(200).json({ ok: true, mode: 'anonymize', pseudonym });
      return;
    }

    if (payload.mode === 'delete') {
      if (payload.gracePeriodDays && payload.gracePeriodDays > 0) {
        console.warn(
          'Grace period requested but scheduler not implemented. Delete executes immediately.'
        );
      }

      await deleteProfile(profile);
      await logGdprAction(req, session.userId, 'delete');
      res.status(200).json({ ok: true, mode: 'delete' });
      return;
    }

    throw new Error(`Unsupported mode: ${payload.mode}`);
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      res
        .status(error.status)
        .json({ error: 'unauthorized', reason: error.message, status: error.status });
      return;
    }

    console.error('Account deletion request failed', error);
    res.status(400).json({
      error: 'account-action-failed',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
}
