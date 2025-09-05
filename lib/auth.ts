import { User, Role } from './models/user';
import { serverConfig } from './config/server';
import jwt from 'jsonwebtoken';
import { SignJWT, jwtVerify } from 'jose';
import { SessionManager } from './auth/sessionManager';

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
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await SessionManager.getCurrentSession();
    return session.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if current user has admin role
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === Role.ADMIN && user.isActive;
}

// Check if current user has permission
export async function currentUserHasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser();
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
