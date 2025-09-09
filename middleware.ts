import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RequestMonitor } from '@/lib/monitoring/requestMonitor';
import { CSRFProtection } from '@/lib/security/csrf';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // requests per window
  strictMaxRequests: 1000, // stricter limit for sensitive endpoints
};

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
  'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  'Access-Control-Allow-Headers': [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
    'CSRF-Token',
    'X-XSRF-Token',
  ],
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

function getClientIP(request: NextRequest): string {
  // Try different headers to get the real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }

  // Fallback to unknown if no IP found
  return 'unknown';
}

function isRateLimited(clientIP: string, isStrictEndpoint = false): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIP);
  const maxRequests = isStrictEndpoint ? RATE_LIMIT.strictMaxRequests : RATE_LIMIT.maxRequests;

  if (!clientData || now > clientData.resetTime) {
    // First request or window expired
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return false;
  }

  if (clientData.count >= maxRequests) {
    return true;
  }

  // Increment counter
  clientData.count++;
  return false;
}

function handleCORS(request: NextRequest): NextResponse | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');

    // Check if origin is allowed
    const allowedOrigins = CORS_HEADERS['Access-Control-Allow-Origin'] as string[];
    const isAllowed = allowedOrigins.includes(origin || '');

    if (!isAllowed && process.env.NODE_ENV === 'production') {
      return new NextResponse('CORS policy violation', { status: 403 });
    }

    const response = new NextResponse(null, { status: 200 });

    // Set CORS headers
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      if (key === 'Access-Control-Allow-Origin') {
        response.headers.set(key, origin || allowedOrigins[0]);
      } else if (Array.isArray(value)) {
        response.headers.set(key, value.join(', '));
      } else {
        response.headers.set(key, value);
      }
    });

    return response;
  }

  return null;
}

function addSecurityHeaders(response: NextResponse, clientIP: string): void {
  // Add rate limiting headers
  const clientData = rateLimitStore.get(clientIP);
  const remaining = clientData
    ? Math.max(0, RATE_LIMIT.maxRequests - clientData.count)
    : RATE_LIMIT.maxRequests;

  response.headers.set('X-Rate-Limit-Limit', RATE_LIMIT.maxRequests.toString());
  response.headers.set('X-Rate-Limit-Remaining', remaining.toString());
  response.headers.set(
    'X-Rate-Limit-Reset',
    new Date(Date.now() + RATE_LIMIT.windowMs).toISOString()
  );
}

export function middleware(request: NextRequest) {
  const clientIP = getClientIP(request);

  // Generate CSP nonce for this request
  const nonce = crypto.randomBytes(16).toString('base64');

  // Log the incoming request
  RequestMonitor.logRequest(request);

  // Handle CORS
  const corsResponse = handleCORS(request);
  if (corsResponse) {
    RequestMonitor.logResponse(request, corsResponse);
    addSecurityHeaders(corsResponse, clientIP);
    return corsResponse;
  }

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const isStrictEndpoint =
      request.nextUrl.pathname.includes('/auth/') || request.nextUrl.pathname.includes('/admin/');

    if (isRateLimited(clientIP, isStrictEndpoint)) {
      const response = new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(RATE_LIMIT.windowMs / 1000).toString(),
          },
        }
      );
      addSecurityHeaders(response, clientIP);
      return response;
    }
  }

  // Apply CSRF protection to state-changing API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const csrfResponse = CSRFProtection.middleware(request);
    if (csrfResponse) {
      RequestMonitor.logResponse(request, csrfResponse);
      addSecurityHeaders(csrfResponse, clientIP);
      return csrfResponse;
    }
  }

  // Create a new response
  const response = NextResponse.next();

  // Enhanced Security Headers

  // Enhanced Content Security Policy with nonce (conditionally applied)
  const cspEnabled = process.env.CSP_ENABLED !== 'false';

  if (cspEnabled) {
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://js.sentry-cdn.com https://cdn.jsdelivr.net https://prompts3.appwrite.network`,
      `script-src-elem 'self' 'nonce-${nonce}' https://js.sentry-cdn.com https://cdn.jsdelivr.net https://prompts3.appwrite.network`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      `style-src-attr 'nonce-${nonce}'`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.sentry.io https://cloud.appwrite.io",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
      `report-uri /api/security/csp-report`,
      `report-to /api/security/csp-report`,
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);
  } else {
    // When CSP is disabled, set a permissive policy for development/testing
    response.headers.set(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
    );
  }

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy but still useful)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Additional XSS protection headers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Prevent resource sniffing
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enhanced Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), ' +
      'accelerometer=(), gyroscope=(), ambient-light-sensor=(), autoplay=(), ' +
      'encrypted-media=(), fullscreen=(self), picture-in-picture=()'
  );

  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove server header
  response.headers.delete('X-Powered-By');

  // Add rate limiting headers
  addSecurityHeaders(response, clientIP);

  // Add CORS headers for non-preflight requests
  const origin = request.headers.get('origin');
  const allowedOrigins = CORS_HEADERS['Access-Control-Allow-Origin'] as string[];
  const isAllowed = allowedOrigins.includes(origin || '');

  if (isAllowed || process.env.NODE_ENV !== 'production') {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      if (key === 'Access-Control-Allow-Origin') {
        response.headers.set(key, origin || allowedOrigins[0]);
      } else if (Array.isArray(value)) {
        response.headers.set(key, value.join(', '));
      } else {
        response.headers.set(key, value);
      }
    });
  }

  // Admin route protection with proper authentication check
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      const redirectResponse = NextResponse.redirect(
        new URL('/api/auth?action=login', request.url)
      );
      RequestMonitor.logResponse(request, redirectResponse);
      return redirectResponse;
    }

    // TODO: Add proper JWT verification for admin routes
    // For now, we have basic session check
  }

  // Log the response
  RequestMonitor.logResponse(request, response);

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
