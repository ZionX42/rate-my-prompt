import 'server-only';
import { cookies } from 'next/headers';
import { createJWT, verifyJWT } from '../auth';
import { User } from '../models/user';
import { randomBytes } from 'crypto';

/**
 * Enhanced Session Management
 */
export class SessionManager {
  private static readonly SESSION_COOKIE_NAME = 'session';
  private static readonly CSRF_COOKIE_NAME = 'csrf_token';
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly ABSOLUTE_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Session configuration for secure cookies
   */
  private static getCookieOptions(rememberMe = false) {
    const maxAge = rememberMe ? this.ABSOLUTE_TIMEOUT / 1000 : this.SESSION_TIMEOUT / 1000;

    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge,
      path: '/',
      // In production, set domain if needed
      ...(process.env.NODE_ENV === 'production' && {
        domain: process.env.COOKIE_DOMAIN,
      }),
    };
  }

  /**
   * Create a new session for a user
   */
  static async createSession(user: User, rememberMe = false): Promise<void> {
    try {
      const cookieStore = await cookies();

      // Create JWT token with user data
      const token = await createJWT({
        userId: user._id,
        email: user.email || '',
        role: user.role,
      });

      // Set session cookie
      cookieStore.set(this.SESSION_COOKIE_NAME, token, this.getCookieOptions(rememberMe));

      // Generate and set CSRF token cookie
      const csrfToken = this.generateCSRFToken();
      cookieStore.set(this.CSRF_COOKIE_NAME, csrfToken, {
        ...this.getCookieOptions(rememberMe),
        httpOnly: false, // CSRF token needs to be readable by client
      });

      console.log(`Session created for user: ${user.email}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Get current session data
   */
  static async getCurrentSession(): Promise<{
    user: User | null;
    isValid: boolean;
    expiresAt: Date | null;
  }> {
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value;

      if (!sessionToken) {
        return { user: null, isValid: false, expiresAt: null };
      }

      // Verify JWT token
      const decoded = await verifyJWT(sessionToken);
      if (!decoded) {
        // Invalid token, clear session
        await this.destroySession();
        return { user: null, isValid: false, expiresAt: null };
      }

      // Check if token is expired
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) {
        await this.destroySession();
        return { user: null, isValid: false, expiresAt: null };
      }

      // Import here to avoid circular dependency
      const { getUserById } = await import('../repos/userRepo');

      const user = await getUserById(decoded.userId);
      if (!user || !user.isActive) {
        await this.destroySession();
        return { user: null, isValid: false, expiresAt: null };
      }

      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;

      return {
        user,
        isValid: true,
        expiresAt,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      await this.destroySession();
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
      const cookieStore = await cookies();

      // Clear session cookie
      cookieStore.set(this.SESSION_COOKIE_NAME, '', {
        ...this.getCookieOptions(),
        maxAge: 0,
      });

      // Clear CSRF cookie
      cookieStore.set(this.CSRF_COOKIE_NAME, '', {
        ...this.getCookieOptions(),
        maxAge: 0,
        httpOnly: false,
      });

      console.log('Session destroyed');
    } catch (error) {
      console.error('Session destruction failed:', error);
      throw error;
    }
  }

  /**
   * Check if session is about to expire (within 30 minutes)
   */
  static async isSessionExpiringSoon(): Promise<boolean> {
    const session = await this.getCurrentSession();
    if (!session.expiresAt) return false;

    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);
    return session.expiresAt < thirtyMinutesFromNow;
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
      const cookieStore = await cookies();
      return cookieStore.get(this.CSRF_COOKIE_NAME)?.value || null;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  }

  /**
   * Generate a secure CSRF token
   */
  private static generateCSRFToken(): string {
    return randomBytes(32).toString('hex');
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
