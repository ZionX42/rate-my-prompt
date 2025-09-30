import type { NextApiRequest, NextApiResponse } from 'next';
import { Query } from '@/lib/appwrite/sdk';
import { getProfileDatabases, getProfileEnv } from '@/lib/appwrite/profileServer';
import { AppwriteAuthError, verifyAppwriteRequest } from '@/lib/appwrite/verifyRequest';

interface CheckUsernamePayload {
  username?: string;
}

function validateUsername(username: string) {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (trimmed.length > 64) {
    throw new Error('Username must be 64 characters or fewer.');
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    throw new Error('Username may contain letters, numbers, dots, underscores, and hyphens only.');
  }
  return trimmed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const payload = (req.body ?? {}) as CheckUsernamePayload;
    const username = payload.username ? validateUsername(payload.username) : null;

    if (!username) {
      throw new Error('Username is required.');
    }

    const env = getProfileEnv();
    const databases = getProfileDatabases();
    const session = await verifyAppwriteRequest(req);
    const currentUserId = session.userId;

    const queries = [Query.equal('username', username.toLowerCase())];
    queries.push(Query.notEqual('$id', currentUserId));

    const result = await databases.listDocuments(env.databaseId, env.profilesCollectionId, queries);

    const available = result.total === 0;
    res
      .status(200)
      .json({ available, message: available ? undefined : 'Username is already taken.' });
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      res
        .status(error.status)
        .json({ available: false, message: error.message, status: error.status });
      return;
    }

    console.error('Username availability check failed', error);
    res.status(400).json({
      available: false,
      message: error instanceof Error ? error.message : 'Unable to check username.',
    });
  }
}
