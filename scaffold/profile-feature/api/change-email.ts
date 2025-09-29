import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAppwriteClient, getUsers } from './appwriteClient.js';

interface ChangeEmailPayload {
  newEmail?: string;
  password?: string;
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

export async function changeEmailHandler(req: IncomingMessage, res: ServerResponse) {
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
    await getAppwriteClient(); // env validation
    const users = getUsers();
    const payload = await readJsonBody<ChangeEmailPayload>(req);

    const newEmail = payload.newEmail?.trim();
    const password = payload.password ?? '';

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      throw new Error('Invalid email address');
    }

    if (password.length === 0) {
      throw new Error('Password is required');
    }

    const sessionVerifier = users as unknown as {
      createEmailSession?: (userId: string, password: string) => Promise<unknown>;
      createEmailPasswordSession?: (userId: string, password: string) => Promise<unknown>;
    };

    try {
      if (sessionVerifier.createEmailSession) {
        await sessionVerifier.createEmailSession(userId, password);
      } else if (sessionVerifier.createEmailPasswordSession) {
        await sessionVerifier.createEmailPasswordSession(userId, password);
      } else {
        throw new Error('Password verification helper missing; wire custom logic.');
      }
    } catch (error) {
      console.warn('Password verification failed', error);
      throw new Error('Password verification failed');
    }

    const updatedUser = await users.updateEmail(userId, newEmail);

    // Optionally invalidate existing sessions when email changes
    // await users.deleteSessions(userId);

    sendJson(res, 200, {
      ok: true,
      requiresVerification: updatedUser.emailVerification ?? false,
      message: updatedUser.emailVerification
        ? 'Verification email sent to the new address.'
        : 'Email updated successfully.',
    });
  } catch (error) {
    console.error('Change email failed', error);
    sendJson(res, 400, {
      error: 'change-email-failed',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
}
