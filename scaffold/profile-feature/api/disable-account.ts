import type { IncomingMessage, ServerResponse } from 'node:http';
import { getDatabases, getEnv, getUsers } from './appwriteClient.js';

interface DisableAccountPayload {
  disabled?: boolean;
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

export async function disableAccountHandler(req: IncomingMessage, res: ServerResponse) {
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
    const payload = await readJsonBody<DisableAccountPayload>(req);
    const disabled = payload.disabled ?? true;

    const env = getEnv();
    const databases = getDatabases();
    const users = getUsers();

    await databases.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PROFILES_COLLECTION_ID,
      userId,
      {
        disabled,
        updatedAt: new Date().toISOString(),
      }
    );

    // Appwrite Users API toggles user status (1 = enabled, 2 = disabled)
    await users.updateStatus(userId, !disabled);

    sendJson(res, 200, { ok: true, disabled });
  } catch (error) {
    console.error('Disable account request failed', error);
    sendJson(res, 400, {
      error: 'disable-account-failed',
      reason: error instanceof Error ? error.message : 'unknown-error',
    });
  }
}
