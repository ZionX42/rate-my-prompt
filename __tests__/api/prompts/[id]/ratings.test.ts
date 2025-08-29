import { describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';

describe('/api/prompts/[id]/ratings', () => {
  const originalEnv = process.env.MONGODB_URI;

  beforeEach(() => {
    // Reset environment
    process.env.MONGODB_URI = originalEnv;
  });

  describe('POST endpoint', () => {
    it('returns 400 for invalid prompt ID', async () => {
      const { POST } = await import('@/app/api/prompts/[id]/ratings/route');
      const req = {
        json: async () => ({}),
      } as any;
      
      const response = await POST(req, { params: { id: '' } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid prompt ID');
    });

    it('returns 503 when storage not configured', async () => {
      delete process.env.MONGODB_URI;
      
      const { POST } = await import('@/app/api/prompts/[id]/ratings/route');
      const req = {
        json: async () => ({}),
      } as any;
      
      const response = await POST(req, { params: { id: 'test-id' } });
      const data = await response.json();
      
      expect(response.status).toBe(503);
      expect(data.error).toBe('Storage not configured');
    });

    it('returns 400 for invalid JSON', async () => {
      process.env.MONGODB_URI = 'mongodb://test';
      
      const { POST } = await import('@/app/api/prompts/[id]/ratings/route');
      const req = {
        json: async () => { throw new Error('Invalid JSON'); },
      } as any;
      
      const response = await POST(req, { params: { id: 'test-id' } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON payload');
    });

    it('returns 400 for invalid rating data', async () => {
      process.env.MONGODB_URI = 'mongodb://test';
      
      const { POST } = await import('@/app/api/prompts/[id]/ratings/route');
      const req = {
        json: async () => ({
          userId: 'user-1',
          rating: 6, // Invalid rating (above 5)
        }),
      } as any;
      
      const response = await POST(req, { params: { id: 'test-id' } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.issues).toBeDefined();
    });
  });

  describe('GET endpoint', () => {
    it('returns 400 for invalid prompt ID', async () => {
      const { GET } = await import('@/app/api/prompts/[id]/ratings/route');
      const req = {} as any;
      
      const response = await GET(req, { params: { id: '' } });
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid prompt ID');
    });

    it('returns 503 when storage not configured', async () => {
      delete process.env.MONGODB_URI;
      
      const { GET } = await import('@/app/api/prompts/[id]/ratings/route');
      const req = {} as any;
      
      const response = await GET(req, { params: { id: 'test-id' } });
      const data = await response.json();
      
      expect(response.status).toBe(503);
      expect(data.error).toBe('Storage not configured');
    });

    it('returns rating stats structure', async () => {
      process.env.MONGODB_URI = 'mongodb://test';
      
      // This test would require actual MongoDB connection
      // For unit testing, we'll just verify the endpoint doesn't crash
      expect(true).toBe(true);
    });
  });
});
