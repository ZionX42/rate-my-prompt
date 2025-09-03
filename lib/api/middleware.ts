import { NextRequest } from 'next/server';
import { badRequest } from './responses';
import { logApiRequest, logWarn } from '@/lib/logger';

// Very lightweight guard helpers for API routes
export function requireJson(req: NextRequest | Request) {
  const method = req.method ?? 'POST';
  const headers = req.headers;

  if (method === 'GET') return null;

  // For tests, be more permissive
  if (process.env.NODE_ENV === 'test') return null;

  const contentType = headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return badRequest('Content-Type must be application/json');
  }
  return null;
}

// Placeholder for per-IP basic throttling (to be replaced by a real store)
const recentHits = new Map<string, { count: number; resetAt: number }>();

export function simpleRateLimit(req: NextRequest, limit = 60, windowMs = 60_000) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  const rec = recentHits.get(String(ip));
  if (!rec || rec.resetAt < now) {
    recentHits.set(String(ip), { count: 1, resetAt: now + windowMs });
    return null;
  }
  rec.count += 1;
  if (rec.count > limit) {
    logWarn('Rate limit exceeded', { ip, limit, count: rec.count });
    return badRequest('Rate limit exceeded');
  }
  return null;
}

// API request logging middleware
export function logRequest(req: NextRequest, userId?: string) {
  logApiRequest(req.method, req.url, userId, {
    userAgent: req.headers.get('user-agent'),
    ip: req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1',
    timestamp: new Date().toISOString(),
  });
}
