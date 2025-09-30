import type { NextApiRequest, NextApiResponse } from 'next';
import { getProfileEnv, getProfileUsers } from '@/lib/appwrite/profileServer';
import { AppwriteAuthError, verifyAppwriteRequest } from '@/lib/appwrite/verifyRequest';

interface ChangeEmailPayload {
  newEmail?: string;
  password?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    getProfileEnv();
    const session = await verifyAppwriteRequest(req);
    const users = getProfileUsers();
    const payload = (req.body ?? {}) as ChangeEmailPayload;

    const newEmail = payload.newEmail?.trim();
    const password = payload.password ?? '';

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      throw new Error('Invalid email address');
    }

    if (password.length === 0) {
      throw new Error('Password is required');
    }

    const verifier = users as unknown as {
      createEmailSession?: (userId: string, password: string) => Promise<unknown>;
      createEmailPasswordSession?: (userId: string, password: string) => Promise<unknown>;
    };

    try {
      if (verifier.createEmailSession) {
        await verifier.createEmailSession(session.userId, password);
      } else if (verifier.createEmailPasswordSession) {
        await verifier.createEmailPasswordSession(session.userId, password);
      } else {
        throw new Error('Password verification helper missing; wire custom logic.');
      }
    } catch (error) {
      console.warn('Password verification failed', error);
      throw new Error('Password verification failed');
    }

    const updated = await users.updateEmail(session.userId, newEmail);

    res.status(200).json({
      ok: true,
      requiresVerification: updated.emailVerification ?? false,
      message: updated.emailVerification
        ? 'Verification email sent to the new address.'
        : 'Email updated successfully.',
    });
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      res
        .status(error.status)
        .json({ error: 'unauthorized', reason: error.message, status: error.status });
      return;
    }

    console.error('Change email failed', error);
    res.status(400).json({
      error: 'change-email-failed',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
}
