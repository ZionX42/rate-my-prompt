import { cookies } from 'next/headers';
import { User, Role } from './models/user';
import { getUserById } from './repos/userRepo';
import { serverConfig } from './config/server';
import jwt from 'jsonwebtoken';
import { SignJWT, jwtVerify } from 'jose';

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
function decodeUserFromToken(token: string): { userId: string } | null {
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
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return null;
    }

    // Try new JWT verification first
    const decoded = await verifyJWT(sessionToken);
    if (!decoded) {
      // Fallback to legacy decoding for backward compatibility
      const legacyDecoded = decodeUserFromToken(sessionToken);
      if (!legacyDecoded) {
        return null;
      }

      // For legacy tokens, we need to fetch user from database
      const user = await getUserById(legacyDecoded.userId);
      return user;
    }

    // For new JWT tokens, we have the user data in the payload
    // But we should still verify the user exists in the database
    const user = await getUserById(decoded.userId);
    if (!user) {
      return null;
    }

    // Update user role if it has changed
    if (user.role !== decoded.role) {
      // Note: In a real implementation, you might want to update the token
      // or handle role changes differently
    }

    return user;
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
