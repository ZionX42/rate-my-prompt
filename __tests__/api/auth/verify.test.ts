/// <reference types="jest" />

import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

let verifyHandler: (request: NextRequest) => Promise<Response>;
let originalFetch: typeof fetch;
let fetchMock: jest.MockedFunction<typeof fetch>;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://example.appwrite.io/v1';
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'project123';
  const verifyModule = await import('@/app/api/auth/verify/route');
  verifyHandler = verifyModule.GET;
});

beforeEach(() => {
  originalFetch = global.fetch;
  fetchMock = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
  global.fetch = fetchMock;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function createRequest(cookie?: string) {
  return new NextRequest('http://localhost/api/auth/verify', {
    headers: cookie ? { cookie } : {},
  });
}

describe('GET /api/auth/verify', () => {
  it('returns 401 when session cookie is missing', async () => {
    const response = await verifyHandler(createRequest());
    expect(response.status).toBe(401);
  });

  it('returns 401 when Appwrite rejects session', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    const response = await verifyHandler(createRequest('a_session_project123=test'));
    expect(response.status).toBe(401);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns 200 and role when authenticated', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ $id: 'user123', email: 'user@example.com', name: 'Test User' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total: 1,
            teams: [
              { $id: 'admins', name: 'Admins' },
              { $id: 'users', name: 'Users' },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

    const response = await verifyHandler(createRequest('a_session_project123=test'));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      authenticated: true,
      role: 'ADMIN',
      user: { id: 'user123', email: 'user@example.com' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to USER role when no mapped teams are present', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ $id: 'user456', email: 'user2@example.com' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ total: 0, teams: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const response = await verifyHandler(createRequest('a_session_project123=test'));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      authenticated: true,
      role: 'USER',
      user: { id: 'user456', email: 'user2@example.com' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
