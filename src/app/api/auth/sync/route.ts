import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { missingAppwriteEnvVars } from '@/lib/appwrite';
import { getUserById, createUser } from '@/lib/repos/userRepo';
import { Role } from '@/lib/models/user';
import { getAppwriteClient } from '@/lib/appwrite/client';
import { Account } from '@/lib/appwrite/sdk';

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

    console.log('Appwrite Auth: Configuration validated successfully');

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;
    const cookieHeader = request.headers.get('cookie') ?? '';
    const authHeader = request.headers.get('authorization') ?? '';
    const jwtHeader = request.headers.get('x-appwrite-jwt') ?? '';
    const sessionCookieName = `a_session_${projectId}`;

    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const jwtToken = (jwtHeader || (bearerMatch ? bearerMatch[1] : '')).trim();

    // More robust cookie detection
    const hasSessionCookie = cookieHeader.split(';').some((cookie) => {
      const trimmed = cookie.trim();
      return (
        trimmed.startsWith(`${sessionCookieName}=`) &&
        trimmed.length > `${sessionCookieName}=`.length
      );
    });

    console.log('Appwrite Auth: Checking for session token');
    console.log('Appwrite Auth: JWT provided:', jwtToken.length > 0);
    console.log('Appwrite Auth: Session cookie name:', sessionCookieName);
    console.log('Appwrite Auth: Cookie header length:', cookieHeader.length);
    console.log('Appwrite Auth: Session cookie found:', hasSessionCookie);
    console.log('Appwrite Auth: Auth header:', authHeader ? 'present' : 'missing');
    console.log('Appwrite Auth: JWT header:', jwtHeader ? 'present' : 'missing');

    // More flexible session detection - accept any valid session method
    if (!jwtToken && !hasSessionCookie) {
      console.log('Appwrite Auth: No valid Appwrite session token provided');
      console.log('Appwrite Auth: Available cookies:', cookieHeader || 'none');
      console.log('Appwrite Auth: Available headers:', {
        auth: authHeader ? 'present' : 'missing',
        jwt: jwtHeader ? 'present' : 'missing',
        cookie: cookieHeader ? 'present' : 'missing',
      });

      // Additional debugging for cookie parsing
      if (cookieHeader) {
        console.log('Appwrite Auth: All cookies:');
        cookieHeader.split(';').forEach((cookie, index) => {
          console.log(`  ${index + 1}: "${cookie.trim()}"`);
        });
      }

      // Try to get current user as a fallback (for debugging purposes)
      try {
        console.log('Appwrite Auth: Attempting fallback user detection...');

        // This is a fallback attempt - may not work without proper session
        const account = new Account(getAppwriteClient());
        const currentUser = await account.get();
        console.log('Appwrite Auth: Fallback user detection succeeded:', currentUser.email);

        // If we get here, use the current user for profile operations
        const user = await getUserById(currentUser.$id);
        if (user) {
          console.log('Appwrite Auth: Fallback profile found');
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
      } catch (fallbackError) {
        console.log(
          'Appwrite Auth: Fallback user detection failed:',
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        );
      }

      return NextResponse.json({ ok: false, reason: 'no-session' }, { status: 401 });
    }

    // Fetch current user account from Appwrite
    console.log('Appwrite Auth: Fetching current user account from Appwrite');
    console.log('Appwrite Auth: Using JWT token:', jwtToken ? 'yes' : 'no');
    console.log('Appwrite Auth: Using session cookie:', hasSessionCookie ? 'yes' : 'no');

    const accountResponse = await fetch(`${endpoint}/account`, {
      method: 'GET',
      headers: {
        ...(jwtToken
          ? { 'X-Appwrite-JWT': jwtToken }
          : hasSessionCookie
            ? { cookie: cookieHeader }
            : {}),
        'X-Appwrite-Project': projectId,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!accountResponse.ok) {
      if (accountResponse.status === 401) {
        console.log('Appwrite Auth: Session expired or invalid');
        console.log('Appwrite Auth: Response status:', accountResponse.status);
        console.log(
          'Appwrite Auth: Response headers:',
          Object.fromEntries(accountResponse.headers.entries())
        );

        const errorText = await accountResponse.text();
        console.log('Appwrite Auth: Error response body:', errorText);

        return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
      }

      const errorText = await accountResponse.text();
      console.error('Appwrite Auth: Failed to fetch account:', errorText);
      console.error('Appwrite Auth: Account response status:', accountResponse.status);
      console.error(
        'Appwrite Auth: Account response headers:',
        Object.fromEntries(accountResponse.headers.entries())
      );
      console.error('Appwrite Auth: Request headers used:', {
        'X-Appwrite-JWT': jwtToken ? 'present' : 'missing',
        cookie: hasSessionCookie ? 'present' : 'missing',
        'X-Appwrite-Project': projectId,
      });

      return NextResponse.json(
        { ok: false, reason: 'appwrite-error', error: errorText },
        { status: 502 }
      );
    }

    const account = (await accountResponse.json()) as AppwriteAccount;
    console.log('Appwrite Auth: Retrieved account for:', account.email);
    console.log('Appwrite Auth: Account ID:', account.$id);

    // Check if user profile exists
    console.log('Appwrite Auth: Checking if user profile exists for ID:', account.$id);
    const user = await getUserById(account.$id);

    if (user) {
      console.log('Appwrite Auth: Existing user profile found');
      console.log('Appwrite Auth: User details:', {
        id: user._id,
        email: user.email,
        role: user.role,
      });
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

    console.log('Appwrite Auth: No existing user profile found, will create new one');

    // Create new user profile
    const displayName = account.name?.trim() || account.email.split('@')[0];
    console.log('Appwrite Auth: Creating new user profile for:', account.email);
    console.log('Appwrite Auth: Display name:', displayName);
    console.log('Appwrite Auth: Document ID:', account.$id);

    let newUser;
    try {
      newUser = await createUser(
        {
          displayName,
          email: account.email,
          role: Role.USER,
          isActive: true,
        },
        { documentId: account.$id }
      );

      console.log('Appwrite Auth: User profile created successfully');
      console.log('Appwrite Auth: New user ID:', newUser._id);
    } catch (createError) {
      console.error('Appwrite Auth: Failed to create user profile:', createError);
      console.error('Appwrite Auth: Create error details:', {
        message: createError instanceof Error ? createError.message : String(createError),
        stack: createError instanceof Error ? createError.stack : undefined,
      });
      throw createError;
    }

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
    console.error('Appwrite Auth: Error type:', typeof error);
    console.error('Appwrite Auth: Error constructor:', error?.constructor?.name);
    console.error(
      'Appwrite Auth: Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error('Appwrite Auth: Error stack:', error instanceof Error ? error.stack : undefined);

    // If it's an Appwrite-related error, try to get more details
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('Appwrite Auth: Error response:', (error as { response?: unknown }).response);
    }

    return NextResponse.json(
      { ok: false, reason: 'sync-failed', error: String(error) },
      { status: 500 }
    );
  }
}
