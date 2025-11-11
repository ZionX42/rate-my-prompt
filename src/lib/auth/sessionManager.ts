import 'server-only';

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

import { createJWT, verifyJWT } from '@/lib/auth';
import type { User } from '@/lib/models/user';
import { getUserById } from '@/lib/repos/userRepo';

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  maxAge?: number;
  domain?: string;
};

type CookieRecord = {
  value: string;
};

type CookieStore = {
  get(name: string): CookieRecord | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
};

interface SessionState {
  user: User | null;
  isValid: boolean;
  expiresAt: Date | null;
}

/**
 * SessionManager centralises session lifecycle tasks (create, verify, rotate, destroy) and exposes
 * helpers the rest of the application can rely on. Implemented as a static utility so it can be
 * imported inside route handlers, server actions, or other server-only modules.
 */
export class SessionManager {
  private static readonly SESSION_COOKIE_NAME = 'session';
  private static readonly CSRF_COOKIE_NAME = 'csrf_token';
  private static readonly SESSION_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours
  private static readonly ABSOLUTE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

  private static cookieStore(): CookieStore {
    return cookies() as unknown as CookieStore;
  }

  private static getCookieOptions(rememberMe = false): CookieOptions {
    const maxAge = rememberMe ? this.ABSOLUTE_MAX_AGE_SECONDS : this.SESSION_MAX_AGE_SECONDS;

    const options: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge,
    };

    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      options.domain = process.env.COOKIE_DOMAIN;
    }

    return options;
  }

  private static generateCSRFToken(): string {
    return randomBytes(32).toString('hex');
  }

  static async createSession(user: User, rememberMe = false): Promise<void> {
    try {
      const jar = this.cookieStore();

      const token = await createJWT({
        userId: user._id,
        email: user.email ?? '',
        role: user.role,
      });

      jar.set(this.SESSION_COOKIE_NAME, token, this.getCookieOptions(rememberMe));

      const csrfToken = this.generateCSRFToken();
      jar.set(this.CSRF_COOKIE_NAME, csrfToken, {
        ...this.getCookieOptions(rememberMe),
        httpOnly: false,
      });
    } catch (error) {
      console.error('Failed to create session', error);
      throw new Error('Session creation failed');
    }
  }

  static async getCurrentSession(): Promise<SessionState> {
    try {
      const jar = this.cookieStore();
      const sessionToken = jar.get(this.SESSION_COOKIE_NAME)?.value;

      if (!sessionToken) {
        return { user: null, isValid: false, expiresAt: null };
      }

      const decoded = await verifyJWT(sessionToken);
      if (!decoded) {
        await this.destroySession();
        return { user: null, isValid: false, expiresAt: null };
      }

      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        await this.destroySession();
        return { user: null, isValid: false, expiresAt: null };
      }

      const user = await getUserById(decoded.userId);
      if (!user || !user.isActive) {
        await this.destroySession();
        return { user: null, isValid: false, expiresAt: null };
      }

      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;

      return { user, isValid: true, expiresAt };
    } catch (error) {
      console.error('Session validation error', error);
      await this.destroySession().catch(() => undefined);
      return { user: null, isValid: false, expiresAt: null };
    }
  }

  /**
   * Rotate session token (create new token with updated expiration)
   */
  static async rotateSession(): Promise<void> {
    try {
      const session = await this.getCurrentSession();
      if (!session.user || !session.isValid) {
        throw new Error('No valid session to rotate');
      }

      // Create new session
      await this.createSession(session.user);
      console.log(`Session rotated for user: ${session.user.email}`);
    } catch (error) {
      console.error('Session rotation failed:', error);
      throw error;
    }
  }

  /**
   * Destroy current session
   */
  static async destroySession(): Promise<void> {
    try {
      const jar = this.cookieStore();
      const baseOptions = this.getCookieOptions();

      jar.set(this.SESSION_COOKIE_NAME, '', {
        ...baseOptions,
        maxAge: 0,
      });

      jar.set(this.CSRF_COOKIE_NAME, '', {
        ...baseOptions,
        httpOnly: false,
        maxAge: 0,
      });
    } catch (error) {
      console.error('Session destruction failed', error);
      throw new Error('Session destruction failed');
    }
  }

  /**
   * Check if session is about to expire (within 30 minutes)
   */
  static async isSessionExpiringSoon(): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session.expiresAt) {
      return false;
    }

    const threshold = Date.now() + 30 * 60 * 1000;
    return session.expiresAt.getTime() < threshold;
  }

  /**
   * Extend session if it's valid
   */
  static async extendSession(): Promise<void> {
    const session = await this.getCurrentSession();
    if (session.user && session.isValid) {
      await this.createSession(session.user);
    }
  }

  /**
   * Get CSRF token from cookie
   */
  static async getCSRFToken(): Promise<string | null> {
    try {
      const jar = this.cookieStore();
      return jar.get(this.CSRF_COOKIE_NAME)?.value ?? null;
    } catch (error) {
      console.error('Failed to get CSRF token', error);
      return null;
    }
  }

  /**
   * Validate session security (check for suspicious activity)
   */
  static async validateSessionSecurity(
    _clientIP: string,
    _userAgent: string
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      const session = await this.getCurrentSession();
      if (!session.user) {
        return { isValid: false, reason: 'No active session' };
      }

      // In a production system, you might want to:
      // 1. Check IP address changes (geo-blocking)
      // 2. Monitor user agent changes
      // 3. Track session usage patterns
      // 4. Implement device fingerprinting

      // For now, just basic validation
      if (!session.user.isActive) {
        return { isValid: false, reason: 'User account is inactive' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Session security validation failed:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }
}
