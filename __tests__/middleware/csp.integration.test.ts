import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

// Mock the request monitor to avoid performance API issues
jest.mock('@/lib/monitoring/requestMonitor', () => ({
  RequestMonitor: {
    logRequest: jest.fn(),
    logResponse: jest.fn(),
  },
}));

describe('CSP Middleware Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should apply strict CSP when enabled', async () => {
    process.env.CSP_ENABLED = 'true';

    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);

    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'self'");
    expect(response.headers.get('Content-Security-Policy')).not.toContain('default-src *');
  });

  it('should apply permissive CSP when disabled', async () => {
    process.env.CSP_ENABLED = 'false';

    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);

    expect(response.headers.get('Content-Security-Policy')).toContain('default-src *');
    expect(response.headers.get('Content-Security-Policy')).toContain("'unsafe-inline'");
    expect(response.headers.get('Content-Security-Policy')).toContain("'unsafe-eval'");
  });

  it('should default to strict CSP when CSP_ENABLED is not set', async () => {
    delete process.env.CSP_ENABLED;

    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);

    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'self'");
  });

  it('should include nonce in CSP when enabled', async () => {
    process.env.CSP_ENABLED = 'true';

    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toMatch(
      /script-src 'self' 'nonce-[^']+' https:\/\/js\.sentry-cdn\.com https:\/\/cdn\.jsdelivr\.net https:\/\/unpkg\.com https:\/\/prompts3\.appwrite\.network/
    );
    expect(csp).toMatch(
      /script-src-elem 'self' 'nonce-[^']+' https:\/\/js\.sentry-cdn\.com https:\/\/cdn\.jsdelivr\.net https:\/\/unpkg\.com https:\/\/prompts3\.appwrite\.network/
    );
    expect(csp).toMatch(
      /style-src 'self' 'nonce-[^']+' https:\/\/fonts\.googleapis\.com https:\/\/cdn\.jsdelivr\.net/
    );
    expect(csp).toMatch(/style-src-attr 'nonce-[^']+' 'unsafe-inline'/);
    expect(csp).toMatch(
      /img-src 'self' data: https: blob: https:\/\/images\.unsplash\.com https:\/\/avatars\.githubusercontent\.com/
    );
    expect(csp).toMatch(
      /connect-src 'self' https:\/\/api\.sentry\.io https:\/\/cloud\.appwrite\.io https:\/\/api\.github\.com wss:\/\/ws\.pusherapp\.com/
    );
    expect(csp).toMatch(/media-src 'self' https:/);
    expect(csp).toMatch(
      /frame-src https:\/\/www\.youtube\.com https:\/\/player\.vimeo\.com https:\/\/codesandbox\.io/
    );
  });

  it('should include CSP report URI when enabled', async () => {
    process.env.CSP_ENABLED = 'true';

    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain(`report-uri /api/security/csp-report`);
  });
});
