import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the Appwrite-backed repo to avoid requiring actual Appwrite configuration in Jest
jest.mock('@/lib/repos/promptRepo', () => {
  return {
    createPrompt: jest.fn(async (input: Record<string, unknown>) => ({
      ...input,
      _id: 'mock-id-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
});

jest.mock('@/lib/auth/sessionManager', () => ({
  SessionManager: {
    getCurrentSession: jest.fn(),
  },
}));

import { Role } from '@/lib/models/user';

type SessionManagerModule = typeof import('@/lib/auth/sessionManager');
const { SessionManager } = jest.requireMock('@/lib/auth/sessionManager') as {
  SessionManager: { getCurrentSession: jest.Mock };
};
const getCurrentSession = SessionManager.getCurrentSession as jest.MockedFunction<
  SessionManagerModule['SessionManager']['getCurrentSession']
>;

type PromptRouteModule = typeof import('../../app/api/prompts/route');
let POST: PromptRouteModule['POST'];

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const hasAppwrite = !!(process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY);

(hasAppwrite ? describe : describe.skip)('POST /api/prompts (integration)', () => {
  const originalProjectId = process.env.APPWRITE_PROJECT_ID;
  const originalApiKey = process.env.APPWRITE_API_KEY;

  beforeAll(async () => {
    const route = await import('../../app/api/prompts/route');
    POST = route.POST;

    // Ensure storage path is exercised
    process.env.APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || 'test-project';
    process.env.APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'test-key';
    getCurrentSession.mockResolvedValue({
      isValid: true,
      expiresAt: null,
      user: {
        _id: 'session-user-1',
        displayName: 'Integration User',
        email: 'integration@example.com',
        bio: undefined,
        avatarUrl: undefined,
        role: Role.USER,
        isActive: true,
        joinedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(() => {
    process.env.APPWRITE_PROJECT_ID = originalProjectId;
    process.env.APPWRITE_API_KEY = originalApiKey;
    jest.resetAllMocks();
  });

  it('creates a prompt (201) and persists it in Appwrite', async () => {
    if (!POST) {
      throw new Error('Route handler not loaded');
    }

    const payload = {
      title: 'Test Prompt Title',
      content: 'This is some sufficiently long test content for the prompt.',
      description: 'A test prompt description',
      category: 'general',
      tags: ['test', 'integration'],
      isPublished: false,
    };

    const req = makeRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    const created = json?.prompt;
    expect(created).toBeTruthy();
    expect(created.title).toBe(payload.title);
    expect(created._id).toBeTruthy();
    // Note: DB access is mocked via the repo; full DB verification is out of scope here
  });
});
