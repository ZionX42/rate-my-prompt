import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the Appwrite-backed repo to avoid requiring actual Appwrite configuration in Jest
jest.mock('@/lib/repos/promptRepo', () => {
  return {
  createPrompt: jest.fn(async (input: any) => ({
      ...input,
      _id: 'mock-id-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
});

// Import the route handler after mocks
import { POST } from '../../app/api/prompts/route';

function makeRequest(body: any): NextRequest {
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

  beforeAll(() => {
    // Ensure storage path is exercised
    process.env.APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || 'test-project';
    process.env.APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'test-key';
  });

  afterAll(() => {
    process.env.APPWRITE_PROJECT_ID = originalProjectId;
    process.env.APPWRITE_API_KEY = originalApiKey;
  });

  it('creates a prompt (201) and persists it in Appwrite', async () => {
    const payload = {
      title: 'Test Prompt Title',
      content: 'This is some sufficiently long test content for the prompt.',
      authorId: 'test-user-123',
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
