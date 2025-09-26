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

  it('should apply hardened CSP when enabled', async () => {
    process.env.CSP_ENABLED = 'true';

    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self' *");
    expect(csp).toContain("script-src 'self' * 'unsafe-inline' 'unsafe-eval'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('should apply permissive CSP when disabled', async () => {
    process.env.CSP_ENABLED = 'false';

    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src * 'unsafe-inline' 'unsafe-eval' data: blob:");
  });

  it('should default to strict CSP when CSP_ENABLED is not set', async () => {
    delete process.env.CSP_ENABLED;

    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self' *");
  });

  it('should include strict CSP without nonce and with wildcard hosts when enabled', async () => {
    process.env.CSP_ENABLED = 'true';

    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("img-src 'self' * data: blob:");
    expect(csp).toContain("connect-src 'self' *");
    expect(csp).toContain("frame-src 'self' *");
    expect(csp).toContain("font-src 'self' *");
  });

  it('should include CSP report URI when enabled', async () => {
    process.env.CSP_ENABLED = 'true';

    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain(`report-uri /api/security/csp-report`);
    expect(csp).toContain('report-to /api/security/csp-report');
  });
});
