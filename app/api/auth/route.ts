import { NextRequest } from 'next/server';
import { createJWT, verifyJWT } from '@/lib/auth';
import {
  getUserByEmail,
  createUserWithPassword,
  verifyUserPassword,
  getUserById,
} from '@/lib/repos/userRepo';
import { User, Role } from '@/lib/models/user';
import { validateServerConfig } from '@/lib/config/server';
import { ok, created, badRequest, unauthorized, internalError } from '@/lib/api/responses';
import { requireJson, logRequest } from '@/lib/api/middleware';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest): Promise<Response> {
  logRequest(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const guard = requireJson(req);
  if (guard) return guard;

  const requestBody = body as Record<string, unknown>;
  const action = requestBody.action as string;

  // Validate server configuration
  try {
    validateServerConfig();
  } catch (error) {
    console.error('Server configuration validation failed:', error);
    return internalError('Server configuration error');
  }

  switch (action) {
    case 'login':
      return await handleLogin(requestBody);
    case 'register':
      return await handleRegister(requestBody);
    case 'logout':
      return await handleLogout();
    case 'verify':
      return await handleVerify();
    default:
      return badRequest('Invalid action');
  }
}

async function handleLogin(body: Record<string, unknown>): Promise<Response> {
  const { email, password } = body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return badRequest('Email and password are required');
  }

  try {
    // Verify user credentials using password hashing
    const user = await verifyUserPassword(email, password);
    if (!user) {
      return unauthorized('Invalid credentials');
    }

    // Create JWT token
    const token = await createJWT({
      userId: user._id,
      email: user.email || '',
      role: user.role,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return ok({
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return internalError('Login failed');
  }
}

async function handleRegister(body: Record<string, unknown>): Promise<Response> {
  const { displayName, email, password } = body;

  if (
    !displayName ||
    !email ||
    !password ||
    typeof displayName !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return badRequest('Display name, email, and password are required');
  }

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return badRequest('User already exists');
    }

    // Create new user
    const newUser: Omit<User, '_id' | 'joinedAt' | 'updatedAt'> = {
      displayName,
      email,
      role: Role.USER,
      isActive: true,
    };

    const createdUser = await createUserWithPassword(newUser, password);

    // Create JWT token
    const token = await createJWT({
      userId: createdUser._id,
      email: createdUser.email || '',
      role: createdUser.role,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return created({
      user: {
        _id: createdUser._id,
        displayName: createdUser.displayName,
        email: createdUser.email,
        role: createdUser.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return internalError('Registration failed');
  }
}

async function handleLogout(): Promise<Response> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return ok({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return internalError('Logout failed');
  }
}

async function handleVerify(): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return unauthorized('No session token');
    }

    const decoded = await verifyJWT(sessionToken);
    if (!decoded) {
      return unauthorized('Invalid token');
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return unauthorized('User not found');
    }

    return ok({
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return unauthorized('Token verification failed');
  }
}
