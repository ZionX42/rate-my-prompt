import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import Tokens from 'csrf';

/**
 * CSRF Protection Middleware for Next.js
 */
export class CSRFProtection {
  private static tokens: Tokens;
  private static secret: string;

  static initialize() {
    if (!this.tokens) {
      this.tokens = new Tokens();
      // In production, use a secure random secret stored in environment
      this.secret = process.env.CSRF_SECRET || this.tokens.secretSync();
    }
  }

  /**
   * Generate a CSRF token for a session
   */
  static generateToken(sessionId?: string): string {
    this.initialize();
    return this.tokens.create(this.secret);
  }

  /**
   * Verify a CSRF token
   */
  static verifyToken(token: string): boolean {
    this.initialize();
    try {
      return this.tokens.verify(this.secret, token);
    } catch (error) {
      console.error('CSRF token verification failed:', error);
      return false;
    }
  }

  /**
   * Middleware function to protect against CSRF attacks
   */
  static middleware(request: NextRequest): NextResponse | null {
    this.initialize();

    // Only protect state-changing methods
    const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    if (!protectedMethods.includes(request.method)) {
      return null; // Allow non-state-changing requests
    }

    // Skip CSRF protection for API routes that handle authentication
    const pathname = request.nextUrl.pathname;
    if (
      pathname.startsWith('/api/auth') ||
      pathname === '/api/health' ||
      pathname === '/api/metrics' ||
      pathname.startsWith('/api/security/')
    ) {
      return null;
    }

    // Check for CSRF token in headers or body
    const token = this.extractToken(request);

    if (!token) {
      console.warn('CSRF token missing for protected request:', {
        method: request.method,
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });

      return NextResponse.json({ error: 'CSRF token required' }, { status: 403 });
    }

    if (!this.verifyToken(token)) {
      console.warn('CSRF token verification failed:', {
        method: request.method,
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });

      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
    }

    return null; // Token is valid, allow request
  }

  /**
   * Extract CSRF token from request
   */
  private static extractToken(request: NextRequest): string | null {
    // Check headers first (preferred method)
    const headerToken =
      request.headers.get('x-csrf-token') ||
      request.headers.get('csrf-token') ||
      request.headers.get('x-xsrf-token');

    if (headerToken) {
      return headerToken;
    }

    // For form submissions, check body
    if (
      request.method === 'POST' &&
      request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')
    ) {
      // Note: In Next.js middleware, we can't easily parse the body
      // The token should be in headers for API requests
      return null;
    }

    return null;
  }

  /**
   * Create CSRF token endpoint response
   */
  static createTokenResponse(): NextResponse {
    this.initialize();
    const token = this.generateToken();

    return NextResponse.json({
      csrfToken: token,
      expiresIn: '1 hour', // Tokens are typically valid for session
    });
  }
}
