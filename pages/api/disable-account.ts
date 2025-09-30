import type { NextApiRequest, NextApiResponse } from 'next';
import { getProfileDatabases, getProfileEnv, getProfileUsers } from '@/lib/appwrite/profileServer';
import { AppwriteAuthError, verifyAppwriteRequest } from '@/lib/appwrite/verifyRequest';

interface DisableAccountPayload {
  disabled?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const payload = (req.body ?? {}) as DisableAccountPayload;
    const disabled = payload.disabled ?? true;

    const env = getProfileEnv();
    const databases = getProfileDatabases();
    const users = getProfileUsers();
    const session = await verifyAppwriteRequest(req);

    await databases.updateDocument(env.databaseId, env.profilesCollectionId, session.userId, {
      disabled,
      updatedAt: new Date().toISOString(),
    });

    await users.updateStatus(session.userId, !disabled);

    res.status(200).json({ ok: true, disabled });
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      res
        .status(error.status)
        .json({ error: 'unauthorized', reason: error.message, status: error.status });
      return;
    }

    console.error('Disable account request failed', error);
    res.status(400).json({
      error: 'disable-account-failed',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
}
