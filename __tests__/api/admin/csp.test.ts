import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/csp/route';
import fs from 'fs';
import path from 'path';

// Mock the auth function
jest.mock('@/lib/auth', () => ({
  isCurrentUserAdmin: jest.fn().mockResolvedValue(true),
}));

// Mock the middleware logger
jest.mock('@/lib/api/middleware', () => ({
  logRequest: jest.fn(),
}));

describe('/api/admin/csp', () => {
  const originalEnv = process.env;
  const envPath = path.join(process.cwd(), '.env');
  let originalEnvContent = '';

  beforeEach(() => {
    // Save original environment
    process.env = { ...originalEnv };

    // Save original .env content
    try {
      originalEnvContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      originalEnvContent = '';
    }
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Restore original .env content
    if (originalEnvContent) {
      fs.writeFileSync(envPath, originalEnvContent, 'utf8');
    }
  });

  describe('GET /api/admin/csp', () => {
    it('should return CSP status when enabled', async () => {
      process.env.CSP_ENABLED = 'false';

      const request = new NextRequest('http://localhost:3000/api/admin/csp');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cspEnabled).toBe(true);
      expect(data.message).toContain('enabled');
    });

    it('should return CSP status when disabled', async () => {
      process.env.CSP_ENABLED = 'false';

      const request = new NextRequest('http://localhost:3000/api/admin/csp');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cspEnabled).toBe(false);
      expect(data.message).toContain('disabled');
    });

    it('should return CSP status when not set (defaults to enabled)', async () => {
      delete process.env.CSP_ENABLED;

      const request = new NextRequest('http://localhost:3000/api/admin/csp');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cspEnabled).toBe(true);
      expect(data.message).toContain('enabled');
    });
  });

  describe('POST /api/admin/csp', () => {
    it('should enable CSP successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/csp', {
        method: 'POST',
        body: JSON.stringify({ enabled: true }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cspEnabled).toBe(true);
      expect(data.message).toContain('enabled');
    });

    it('should disable CSP successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/csp', {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cspEnabled).toBe(false);
      expect(data.message).toContain('disabled');
    });

    it('should return error for invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/csp', {
        method: 'POST',
        body: JSON.stringify({ enabled: 'invalid' }),
        headers: { 'content-type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('boolean');
    });

    it('should update .env file when toggling CSP', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/csp', {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
        headers: { 'content-type': 'application/json' },
      });

      await POST(request);

      // Check if .env file was updated
      const envContent = fs.readFileSync(envPath, 'utf8');
      expect(envContent).toContain('CSP_ENABLED="false"');
    });
  });
});
