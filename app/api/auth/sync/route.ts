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

export async function POST(request: NextRequest) {
  const missing = missingAppwriteEnvVars();
  if (missing.length > 0) {
    return NextResponse.json({ ok: false, reason: 'config-missing', missing }, { status: 503 });
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieName = `a_session_${projectId}`;
  if (!cookieHeader.includes(cookieName)) {
    return NextResponse.json({ ok: false, reason: 'no-session' }, { status: 401 });
  }

  try {
    const response = await fetch(`${endpoint}/account`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
        'X-Appwrite-Project': projectId,
        accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401) {
      return NextResponse.json({ ok: false, reason: 'unauthorised' }, { status: 401 });
    }

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { ok: false, reason: 'appwrite-error', error: text },
        { status: 502 }
      );
    }

    const account = (await response.json()) as AppwriteAccount;

    const existing = await getUserById(account.$id);
    if (existing) {
      return NextResponse.json({ ok: true, user: existing, created: false });
    }

    const displayName = account.name?.trim() || account.email;

    const created = await createUser(
      {
        displayName,
        email: account.email,
        role: Role.USER,
        isActive: true,
      },
      { documentId: account.$id }
    );

    return NextResponse.json({ ok: true, user: created, created: true });
  } catch (error) {
    console.error('User sync failed', error);
    return NextResponse.json({ ok: false, reason: 'sync-failed' }, { status: 500 });
  }
}
