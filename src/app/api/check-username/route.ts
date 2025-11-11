import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CheckUsernamePayload;
    const username = payload.username ? validateUsername(payload.username) : null;

    if (!username) {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    const env = getProfileEnv();
    const databases = getProfileDatabases();
    const session = await verifyAppwriteRequest(req);
    const currentUserId = session.userId;

    const queries = [Query.equal('username', username.toLowerCase())];
    queries.push(Query.notEqual('$id', currentUserId));

    const result = await databases.listDocuments(env.databaseId, env.profilesCollectionId, queries);

    const available = result.total === 0;
    return NextResponse.json({
      available,
      message: available ? undefined : 'Username is already taken.',
    });
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      return NextResponse.json(
        { available: false, message: error.message },
        { status: error.status }
      );
    }

    console.error('Username availability check failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Unable to check username.';
    return NextResponse.json(
      {
        available: false,
        message: errorMessage,
      },
      { status: 400 }
    );
  }
}
