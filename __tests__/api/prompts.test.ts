import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request as UndiciRequest } from 'undici';

// Import the route handlers directly
import { POST } from '../../app/api/prompts/route';

function makeRequest(body: any): Request {
  return new UndiciRequest('http://localhost/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

describe('POST /api/prompts', () => {
  const originalUri = process.env.MONGODB_URI;

  beforeEach(() => {
    // Reset env override
    process.env.MONGODB_URI = originalUri;
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new UndiciRequest('http://localhost/api/prompts', { method: 'POST', body: '{bad json' as any }) as unknown as Request;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid payload', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.issues).toBeTruthy();
  });

  it('returns 503 when storage is not configured', async () => {
    process.env.MONGODB_URI = '';
    const req = makeRequest({ title: 'A title', content: 'Some long content goes here', authorId: 'u1' });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
