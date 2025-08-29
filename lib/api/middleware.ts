import { NextRequest } from 'next/server';
import { badRequest } from './responses';

// Very lightweight guard helpers for API routes
export function requireJson(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (req.method !== 'GET' && !contentType.includes('application/json')) {
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
    return badRequest('Rate limit exceeded');
  }
  return null;
}
