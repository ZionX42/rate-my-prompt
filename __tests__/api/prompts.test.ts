import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request as UndiciRequest } from 'undici';
import type { NextRequest } from 'next/server';

// Import the route handlers directly
import { POST } from '../../app/api/prompts/route';

function makeRequest(body: any): NextRequest {
  return new UndiciRequest('http://localhost/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/prompts', () => {
  const originalProjectId = process.env.APPWRITE_PROJECT_ID;
  const originalApiKey = process.env.APPWRITE_API_KEY;

  beforeEach(() => {
    // Reset env override
    process.env.APPWRITE_PROJECT_ID = originalProjectId;
    process.env.APPWRITE_API_KEY = originalApiKey;
  });

  it('returns 400 for invalid JSON', async () => {
  const req = new UndiciRequest('http://localhost/api/prompts', { method: 'POST', body: '{bad json' as any }) as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid payload', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
  expect(json.error).toBe('Validation failed');
  expect(json.details).toBeTruthy();
  });

  it('returns 503 when storage is not configured', async () => {
    process.env.APPWRITE_PROJECT_ID = '';
    process.env.APPWRITE_API_KEY = '';
    const req = makeRequest({ title: 'A title', content: 'Some long content goes here', authorId: 'u1' });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
