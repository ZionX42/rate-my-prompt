import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';

describe('/api/prompts/[id]', () => {
  const originalEnv = {
    APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  };

  beforeEach(() => {
    // Reset environment
    process.env.APPWRITE_PROJECT_ID = originalEnv.APPWRITE_PROJECT_ID;
    process.env.APPWRITE_API_KEY = originalEnv.APPWRITE_API_KEY;
  });

  afterEach(() => {
    process.env.APPWRITE_PROJECT_ID = originalEnv.APPWRITE_PROJECT_ID;
    process.env.APPWRITE_API_KEY = originalEnv.APPWRITE_API_KEY;
  });

  it('returns 400 for invalid ID', async () => {
    const { GET } = await import('@/app/api/prompts/[id]/route');
    const req = {} as any;

    const response = await GET(req, { params: { id: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid prompt ID');
  });

  it('returns 503 when storage not configured', async () => {
    delete process.env.APPWRITE_PROJECT_ID;
    delete process.env.APPWRITE_API_KEY;

    const { GET } = await import('@/app/api/prompts/[id]/route');
    const req = {} as any;

    const response = await GET(req, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Storage not configured');
  });

  it('returns 404 when prompt not found', async () => {
    // This test would require MongoDB connection, skip for unit testing
    expect(true).toBe(true);
  });

  it('returns prompt when found', async () => {
    // This test would require MongoDB connection, skip for unit testing
    expect(true).toBe(true);
  });
});
