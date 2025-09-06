import { NextRequest } from 'next/server';
import { getUserByEmail, createUserWithPassword, verifyUserPassword } from '@/lib/repos/userRepo';
import { User, Role } from '@/lib/models/user';
import { validateServerConfig } from '@/lib/config/server';
import { ok, created, badRequest, unauthorized, internalError } from '@/lib/api/responses';
import { requireJson, logRequest } from '@/lib/api/middleware';
import { InputValidation } from '@/lib/security/validation';
import { SessionManager } from '@/lib/auth/sessionManager';

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

  // Validate email format
  const emailValidation = InputValidation.validateEmail(email);
  if (!emailValidation.isValid) {
    return badRequest(emailValidation.errors.join(', '));
  }

  try {
    // Verify user credentials using password hashing
    const user = await verifyUserPassword(emailValidation.sanitized, password);
    if (!user) {
      return unauthorized('Invalid credentials');
    }

    // Create session using SessionManager
    await SessionManager.createSession(user);

    return ok({
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
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

  // Validate email format
  const emailValidation = InputValidation.validateEmail(email);
  if (!emailValidation.isValid) {
    return badRequest(emailValidation.errors.join(', '));
  }

  // Validate display name
  const displayNameValidation = InputValidation.validateDisplayName(displayName);
  if (!displayNameValidation.isValid) {
    return badRequest(displayNameValidation.errors.join(', '));
  }

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(emailValidation.sanitized);
    if (existingUser) {
      return badRequest('User already exists');
    }

    // Create new user
    const newUser: Omit<User, '_id' | 'joinedAt' | 'updatedAt'> = {
      displayName: displayNameValidation.sanitized,
      email: emailValidation.sanitized,
      role: Role.USER,
      isActive: true,
    };

    const createdUser = await createUserWithPassword(newUser, password);

    // Create session using SessionManager
    await SessionManager.createSession(createdUser);

    return created({
      user: {
        _id: createdUser._id,
        displayName: createdUser.displayName,
        email: createdUser.email,
        role: createdUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return internalError('Registration failed');
  }
}

async function handleLogout(): Promise<Response> {
  try {
    await SessionManager.destroySession();
    return ok({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return internalError('Logout failed');
  }
}

async function handleVerify(): Promise<Response> {
  try {
    const session = await SessionManager.getCurrentSession();

    if (!session.isValid || !session.user) {
      return unauthorized('Invalid session');
    }

    return ok({
      user: {
        _id: session.user._id,
        displayName: session.user.displayName,
        email: session.user.email,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return unauthorized('Session verification failed');
  }
}
