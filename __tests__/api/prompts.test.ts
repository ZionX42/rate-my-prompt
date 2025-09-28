import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request as UndiciRequest } from 'undici';
import type { NextRequest } from 'next/server';

jest.mock('@/lib/auth/sessionManager', () => ({
  SessionManager: {
    getCurrentSession: jest.fn(),
  },
}));

import { SessionManager } from '@/lib/auth/sessionManager';
import { Role } from '@/lib/models/user';

// Import the route handlers directly
import { POST } from '../../app/api/prompts/route';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new UndiciRequest('http://localhost/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/prompts', () => {
  const originalProjectId = process.env.APPWRITE_PROJECT_ID;
  const originalApiKey = process.env.APPWRITE_API_KEY;
  const getCurrentSession = SessionManager.getCurrentSession as jest.MockedFunction<
    typeof SessionManager.getCurrentSession
  >;

  const validSession = {
    user: {
      _id: 'user-123',
      displayName: 'Test User',
      email: 'test@example.com',
      bio: undefined,
      avatarUrl: undefined,
      role: Role.USER,
      isActive: true,
      joinedAt: new Date(),
      updatedAt: new Date(),
    },
    isValid: true,
    expiresAt: null,
  };

  beforeEach(() => {
    // Reset env override
    process.env.APPWRITE_PROJECT_ID = originalProjectId;
    process.env.APPWRITE_API_KEY = originalApiKey;
    if (!process.env.APPWRITE_PROJECT_ID) process.env.APPWRITE_PROJECT_ID = 'test-project';
    if (!process.env.APPWRITE_API_KEY) process.env.APPWRITE_API_KEY = 'test-key';
    getCurrentSession.mockResolvedValue(validSession);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new UndiciRequest('http://localhost/api/prompts', {
      method: 'POST',
      body: '{bad json',
    }) as unknown as NextRequest;
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
    const req = makeRequest({
      title: 'A title',
      content: 'Some long content goes here',
      authorId: 'u1',
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
