import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { missingAppwriteEnvVars } from '@/lib/appwrite';
import { getUserById, createUser } from '@/lib/repos/userRepo';
import { Role } from '@/lib/models/user';

interface AppwriteAccount {
  $id: string;
  email: string;
  name?: string;
}

/**
 * Simplified Appwrite-only authentication sync
 * Creates/updates user profile from Appwrite session
 * No JWT tokens or custom session management
 */
export async function POST(request: NextRequest) {
  console.log('Appwrite Auth: Starting user profile sync');

  try {
    const missing = missingAppwriteEnvVars();
    if (missing.length > 0) {
      console.error('Appwrite Auth: Missing configuration:', missing);
      return NextResponse.json({ ok: false, reason: 'config-missing', missing }, { status: 503 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;
    const cookieHeader = request.headers.get('cookie') ?? '';
    const sessionCookieName = `a_session_${projectId}`;

    console.log('Appwrite Auth: Checking for session cookie:', sessionCookieName);
    console.log('Appwrite Auth: Cookie header length:', cookieHeader.length);
    console.log('Appwrite Auth: Session cookie found:', cookieHeader.includes(sessionCookieName));

    if (!cookieHeader.includes(sessionCookieName)) {
      console.log('Appwrite Auth: No valid Appwrite session found');
      console.log('Appwrite Auth: Available cookies:', cookieHeader.substring(0, 200) + '...');
      return NextResponse.json({ ok: false, reason: 'no-session' }, { status: 401 });
    }

    // Fetch current user account from Appwrite
    const accountResponse = await fetch(`${endpoint}/account`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
        'X-Appwrite-Project': projectId,
        accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!accountResponse.ok) {
      if (accountResponse.status === 401) {
        console.log('Appwrite Auth: Session expired or invalid');
        return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
      }

      const errorText = await accountResponse.text();
      console.error('Appwrite Auth: Failed to fetch account:', errorText);
      return NextResponse.json(
        { ok: false, reason: 'appwrite-error', error: errorText },
        { status: 502 }
      );
    }

    const account = (await accountResponse.json()) as AppwriteAccount;
    console.log('Appwrite Auth: Retrieved account for:', account.email);

    // Check if user profile exists
    const user = await getUserById(account.$id);

    if (user) {
      console.log('Appwrite Auth: Existing user profile found');
      return NextResponse.json({
        ok: true,
        user: {
          id: user._id,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
        created: false,
      });
    }

    // Create new user profile
    const displayName = account.name?.trim() || account.email.split('@')[0];
    console.log('Appwrite Auth: Creating new user profile for:', account.email);

    const newUser = await createUser(
      {
        displayName,
        email: account.email,
        role: Role.USER,
        isActive: true,
      },
      { documentId: account.$id }
    );

    console.log('Appwrite Auth: User profile created successfully');

    return NextResponse.json({
      ok: true,
      user: {
        id: newUser._id,
        displayName: newUser.displayName,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
      created: true,
    });
  } catch (error) {
    console.error('Appwrite Auth: Sync failed:', error);
    return NextResponse.json(
      { ok: false, reason: 'sync-failed', error: String(error) },
      { status: 500 }
    );
  }
}
