import { cookies } from 'next/headers';
import { User, Role } from './models/user';
import { getUserById } from './repos/userRepo';

// Placeholder for JWT decoding - replace with actual implementation
function decodeUserFromToken(token: string): { userId: string } | null {
  // TODO: Implement JWT verification
  // For testing, return mock admin user if admin cookie is set
  if (token === 'admin') {
    return { userId: 'mock-admin-id' };
  }
  return null;
}

// Get current user from request
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return null;
    }

    const decoded = decodeUserFromToken(sessionToken);
    if (!decoded) {
      return null;
    }

    // For testing, return mock admin user
    if (decoded.userId === 'mock-admin-id') {
      return {
        _id: 'mock-admin-id',
        displayName: 'Mock Admin',
        email: 'admin@example.com',
        role: Role.ADMIN,
        isActive: true,
        joinedAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const user = await getUserById(decoded.userId);
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
  const { hasPermission } = await import('./permissions');
  return hasPermission(user.role, permission as any);
}
