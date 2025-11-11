import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { missingAppwriteEnvVars } from '@/lib/appwrite';

interface AppwriteAccount {
  $id: string;
  email: string;
  name?: string;
}

interface AppwriteTeamList {
  total: number;
  teams: AppwriteTeam[];
}

interface AppwriteTeam {
  $id: string;
  name: string;
}

type AppRole = 'ADMIN' | 'MODERATOR' | 'CREATOR' | 'USER';

const TEAM_ROLE_MAP: Record<string, AppRole> = {
  admins: 'ADMIN',
  moderators: 'MODERATOR',
  creators: 'CREATOR',
  users: 'USER',
};

const ROLE_PRIORITY: Record<AppRole, number> = {
  USER: 0,
  CREATOR: 1,
  MODERATOR: 2,
  ADMIN: 3,
};

export async function GET(request: NextRequest) {
  const missing = missingAppwriteEnvVars();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        authenticated: false,
        reason: 'config-missing',
        missing,
      },
      { status: 503 }
    );
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieName = `a_session_${projectId}`;

  if (!cookieHeader.includes(cookieName)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
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
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { authenticated: false, reason: 'appwrite-error', error: errorText },
        { status: 502 }
      );
    }

    const account = (await response.json()) as AppwriteAccount;

    let role: AppRole = 'USER';

    try {
      const teamsResponse = await fetch(`${endpoint}/teams`, {
        method: 'GET',
        headers: {
          cookie: cookieHeader,
          'X-Appwrite-Project': projectId,
          accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (teamsResponse.ok) {
        const { teams } = (await teamsResponse.json()) as AppwriteTeamList;
        for (const team of teams) {
          const mappedRole = TEAM_ROLE_MAP[team.$id] ?? TEAM_ROLE_MAP[team.name.toLowerCase()];
          if (mappedRole && ROLE_PRIORITY[mappedRole] > ROLE_PRIORITY[role]) {
            role = mappedRole;
          }
        }
      } else if (teamsResponse.status !== 404) {
        const errorText = await teamsResponse.text();
        console.warn('Failed to load Appwrite teams', teamsResponse.status, errorText);
      }
    } catch (error) {
      console.warn('Failed to load Appwrite teams during verify', error);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: account.$id,
        email: account.email,
        name: account.name ?? null,
      },
      role,
    });
  } catch (error) {
    console.error('Appwrite verification failed', error);
    return NextResponse.json(
      { authenticated: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
