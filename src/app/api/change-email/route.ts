import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProfileEnv, getProfileUsers } from '@/lib/appwrite/profileServer';
import { AppwriteAuthError, verifyAppwriteRequest } from '@/lib/appwrite/verifyRequest';

interface ChangeEmailPayload {
  newEmail?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  try {
    getProfileEnv();
    const session = await verifyAppwriteRequest(req);
    const users = getProfileUsers();
    const payload = (await req.json()) as ChangeEmailPayload;

    const newEmail = payload.newEmail?.trim();
    const password = payload.password ?? '';

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (password.length === 0) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Password verification failed' }, { status: 401 });
    }

    const updated = await users.updateEmail(session.userId, newEmail);

    return NextResponse.json({
      ok: true,
      requiresVerification: updated.emailVerification ?? false,
      message: updated.emailVerification
        ? 'Verification email sent to the new address.'
        : 'Email updated successfully.',
    });
  } catch (error) {
    if (error instanceof AppwriteAuthError) {
      return NextResponse.json(
        { error: 'unauthorized', reason: error.message },
        { status: error.status }
      );
    }

    console.error('Change email failed', error);
    const errorMessage = error instanceof Error ? error.message : 'unknown-error';
    return NextResponse.json(
      {
        error: 'change-email-failed',
        reason: errorMessage,
      },
      { status: 400 }
    );
  }
}
