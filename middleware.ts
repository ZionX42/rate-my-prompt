import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RequestMonitor } from '@/lib/monitoring/requestMonitor';
import { CSRFProtection } from '@/lib/security/csrf';
// import crypto from 'crypto';

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
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  if (clientIP) return clientIP;
  return 'unknown';
}

function isRateLimited(clientIP: string, isStrictEndpoint = false): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIP);
  const maxRequests = isStrictEndpoint ? RATE_LIMIT.strictMaxRequests : RATE_LIMIT.maxRequests;

  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return false;
  }

  if (clientData.count >= maxRequests) return true;

  clientData.count++;
  return false;
}

function handleCORS(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');

    const allowedOrigins = CORS_HEADERS['Access-Control-Allow-Origin'] as string[];
    const isAllowed = allowedOrigins.includes(origin || '');

    if (!isAllowed && process.env.NODE_ENV === 'production') {
      return new NextResponse('CORS policy violation', { status: 403 });
    }
    const response = new NextResponse(null, { status: 200 });

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

  // Note: We avoid inline scripts and therefore do not generate a CSP nonce.

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

  // Central, minimal‑yet‑safe CSP configuration
  const cspEnabled = process.env.CSP_ENABLED !== 'false';
  const isDev = process.env.NODE_ENV === 'development';

  // Optional environment-driven extensions
  const extraScriptSrc = (process.env.CSP_EXTRA_SCRIPT_SRC || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
  const extraConnectSrc = (process.env.CSP_EXTRA_CONNECT_SRC || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
  const extraImgSrc = (process.env.CSP_EXTRA_IMG_SRC || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
  // const extraFrameSrc = (process.env.CSP_EXTRA_FRAME_SRC || '')
  //   .split(',')
  //   .map((s) => s.trim())
  //   .filter(Boolean)
  //   .join(' ');

  if (cspEnabled) {
    // Required third-party hosts used by the app (wildcards for multi-env deployments)
    const REQUIRED_SCRIPT_CDNS = [
      'https://js.sentry-cdn.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://*.appwrite.network',
      'https://*.vercel.app',
    ].join(' ');
    const REQUIRED_CONNECT = [
      'https://api.sentry.io',
      'https://cloud.appwrite.io',
      'https://api.github.com',
      'wss://ws.pusherapp.com',
      'https://*.appwrite.network',
      'https://*.vercel.app',
    ].join(' ');
    const REQUIRED_STYLE_CDNS = [
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
    ].join(' ');
    const REQUIRED_FONT_ASSETS = [
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
    ].join(' ');

    // Strict policy without inline scripts or nonces. Allow unsafe-eval only in dev if needed by tooling.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      `script-src 'self' ${REQUIRED_SCRIPT_CDNS} ${extraScriptSrc} ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ''}`.trim(),
      `script-src-elem 'self' ${REQUIRED_SCRIPT_CDNS} ${extraScriptSrc} ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ''}`.trim(),
      `style-src 'self' 'unsafe-inline' ${REQUIRED_STYLE_CDNS}`,
      `style-src-attr 'unsafe-inline'`,
      `img-src 'self' data: blob: https: https://*.appwrite.network https://*.vercel.app ${extraImgSrc}`.trim(),
      `connect-src 'self' ${REQUIRED_CONNECT} ${extraConnectSrc}`.trim(),
      `font-src 'self' ${REQUIRED_FONT_ASSETS} data:`,
      `media-src 'self' https:`,
      `frame-src https://www.youtube.com https://player.vimeo.com https://codesandbox.io`,
      "frame-ancestors 'self'",
      'upgrade-insecure-requests',
      'report-uri /api/security/csp-report',
      'report-to /api/security/csp-report',
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);
  } else {
    // Dev/test-only permissive policy
    response.headers.set(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
    );
  }

  // Other security headers (centralized here)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // More compatible than require-corp for third-party embeds
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), ' +
      'accelerometer=(), gyroscope=(), autoplay=(), ' +
      'encrypted-media=(), fullscreen=(self), picture-in-picture=()'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

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

  // Admin route protection (placeholder)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      const redirectResponse = NextResponse.redirect(
        new URL('/api/auth?action=login', request.url)
      );
      RequestMonitor.logResponse(request, redirectResponse);
      return redirectResponse;
    }
  }

  // Log the response
  RequestMonitor.logResponse(request, response);

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ['/((?!api/health|_next/static|_next/image|favicon.ico|public).*)'],
};
