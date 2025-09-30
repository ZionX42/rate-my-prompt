import type { NextApiRequest } from 'next';
import { serverConfig } from '@/lib/config/server';

export interface AppwriteAccountPayload {
  $id: string;
  email: string;
  name?: string;
  status?: number;
  emailVerification?: boolean;
  prefs?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VerifiedAppwriteSession {
  userId: string;
  jwt: string;
  account: AppwriteAccountPayload;
}

export class AppwriteAuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 401
  ) {
    super(message);
    this.name = 'AppwriteAuthError';
  }
}

function extractJwt(req: NextApiRequest): string | null {
  const header = req.headers['x-appwrite-jwt'] ?? req.headers['authorization'];

  if (!header) {
    return null;
  }

  if (Array.isArray(header)) {
    const value = header[0];
    if (!value) return null;
    return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
  }

  const value = header.trim();
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value;
}

export async function verifyAppwriteRequest(req: NextApiRequest): Promise<VerifiedAppwriteSession> {
  const jwt = extractJwt(req);
  if (!jwt) {
    throw new AppwriteAuthError('Missing Appwrite JWT token', 401);
  }

  const endpoint = serverConfig.appwrite.endpoint?.trim();
  const projectId = serverConfig.appwrite.projectId?.trim();

  if (!endpoint || !projectId) {
    throw new AppwriteAuthError('Appwrite authentication is not configured on this server', 503);
  }

  const response = await fetch(`${endpoint}/account`, {
    method: 'GET',
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-JWT': jwt,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new AppwriteAuthError(`Failed to verify Appwrite session: ${errorText}`, response.status);
  }

  const account = (await response.json()) as AppwriteAccountPayload;
  if (!account?.$id) {
    throw new AppwriteAuthError('Appwrite account payload malformed', 401);
  }

  return {
    userId: account.$id,
    jwt,
    account,
  };
}
