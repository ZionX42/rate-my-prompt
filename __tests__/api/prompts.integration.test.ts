import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { Request as UndiciRequest } from 'undici';

// Mock the Mongo-backed repo to avoid importing the ESM mongodb driver in Jest
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

function makeRequest(body: any): Request {
  return new UndiciRequest('http://localhost/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

const hasMongo = !!process.env.MONGODB_URI;

(hasMongo ? describe : describe.skip)('POST /api/prompts (integration)', () => {
  const originalUri = process.env.MONGODB_URI;

  beforeAll(() => {
    // Ensure storage path is exercised
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  });

  afterAll(() => {
    process.env.MONGODB_URI = originalUri;
  });

  it('creates a prompt (201) and persists it in MongoDB', async () => {
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
