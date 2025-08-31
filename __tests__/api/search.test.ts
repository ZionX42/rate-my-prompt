/** @jest-environment node */

import { describe, it, expect, jest, beforeAll, afterEach } from '@jest/globals';
// promptRepo is mocked below
import { Request as UndiciRequest } from 'undici';

jest.mock('@/lib/repos/promptRepo', () => ({
  __esModule: true,
  // other exports can be added as needed
  searchPrompts: jest.fn(),
}));


describe('GET /api/search', () => {
  beforeAll(() => {
    process.env.APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || 'test-project';
    process.env.APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'test-key';
  });

  afterEach(() => { jest.resetAllMocks(); });

  it('returns results with parsed query params', async () => {
    const mocked: any = jest.requireMock('@/lib/repos/promptRepo');
  mocked.searchPrompts.mockResolvedValue([{ _id: 'p1', title: 'T' }]);
    const { GET } = await import('@/app/api/search/route');
    const req = new UndiciRequest('http://localhost/api/search?q=test&category=Code&minRating=3&sort=newest&dateFrom=2024-01-01', {
      method: 'GET',
    }) as unknown as Request;

    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([{ _id: 'p1', title: 'T' }]);

  expect((jest.requireMock('@/lib/repos/promptRepo') as any).searchPrompts).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'test', category: 'Code', minRating: 3, sort: 'newest' })
    );
  });

  it('validates minRating must be a number', async () => {
    const req = new UndiciRequest('http://localhost/api/search?minRating=abc', { method: 'GET' }) as unknown as Request;
    const { GET } = await import('@/app/api/search/route');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('minRating must be a number');
  });
});
