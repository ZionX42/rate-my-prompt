import { SignJWT, jwtVerify } from 'jose';
import jwt from 'jsonwebtoken';
import { serverConfig } from './config/server';
import { missingAppwriteEnvVars } from './appwrite';
import { getUserById } from './repos/userRepo';
import { Role, User } from './models/user';
import type { NextRequest } from 'next/server';

// JWT payload interface
interface CustomJWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// Create JWT token
export async function createJWT(payload: Omit<CustomJWTPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = new TextEncoder().encode(serverConfig.jwt.secret);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(serverConfig.jwt.expiresIn)
    .sign(secret);

  return token;
}

// Verify and decode JWT token
export async function verifyJWT(token: string): Promise<CustomJWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(serverConfig.jwt.secret);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CustomJWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Legacy JWT decoding for backward compatibility (using jsonwebtoken)
function _decodeUserFromToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, serverConfig.jwt.secret) as CustomJWTPayload;
    return { userId: decoded.userId };
  } catch (error) {
    console.error('Legacy JWT decoding failed:', error);
    return null;
  }
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const account = await fetchCurrentAccount(request);
    if (!account) {
      return null;
    }

    const profile = await getUserById(account.$id);
    if (profile) {
      return profile;
    }

    const now = new Date();
    return {
      _id: account.$id,
      displayName: account.name ?? account.email ?? 'User',
      email: account.email,
      bio: undefined,
      avatarUrl: undefined,
      role: Role.USER,
      isActive: true,
      joinedAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if current user has admin role
export async function isCurrentUserAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === Role.ADMIN && user.isActive;
}

// Check if current user has permission
export async function currentUserHasPermission(
  permission: string,
  request: NextRequest
): Promise<boolean> {
  const user = await getCurrentUser(request);
  if (!user || !user.isActive) {
    return false;
  }

  // Import here to avoid circular dependency
  const { hasPermission, Permission } = await import('./permissions');

  // Try to match the permission string to the enum
  const permissionEnum = Object.values(Permission).find((p) => p === permission);
  if (!permissionEnum) {
    return false;
  }

  return hasPermission(user.role, permissionEnum);
}

interface AppwriteAccount {
  $id: string;
  email: string;
  name?: string;
}

async function fetchCurrentAccount(request: NextRequest): Promise<AppwriteAccount | null> {
  const missing = missingAppwriteEnvVars();
  if (missing.length > 0) {
    return null;
  }

  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const sessionName = `a_session_${projectId}`;
  if (!cookieHeader.includes(sessionName)) {
    return null;
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

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AppwriteAccount;
  } catch (error) {
    console.error('Failed to fetch Appwrite account', error);
    return null;
  }
}
