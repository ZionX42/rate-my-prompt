import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProfileDatabases, getProfileEnv, getProfileUsers } from '@/lib/appwrite/profileServer';
import { AppwriteAuthError, verifyAppwriteRequest } from '@/lib/appwrite/verifyRequest';

interface DisableAccountPayload {
  disabled?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as DisableAccountPayload;
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

    return NextResponse.json({ ok: true, disabled });
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      return NextResponse.json(
        { error: 'unauthorized', reason: error.message },
        { status: error.status }
      );
    }

    console.error('Disable account request failed', error);
    const errorMessage = error instanceof Error ? error.message : 'unknown-error';
    return NextResponse.json(
      {
        error: 'disable-account-failed',
        reason: errorMessage,
      },
      { status: 400 }
    );
  }
}
