import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

type ResponseInit = ConstructorParameters<typeof Response>[1];

// Unified error body formatter. Always returns { error, details? } and, for backward compatibility,
// adds an `issues` alias when details looks like a Zod-style issues array.
function formatErrorBody(message: string, details?: unknown) {
  const body: { error: string; details?: unknown; issues?: unknown } = { error: message };
  if (details !== undefined) {
    body.details = details;
    // If details is a Zod-like issues array, also expose `issues` for legacy consumers/tests
    if (Array.isArray(details)) {
      body.issues = details;
    }
  }
  return body;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 201, ...init });
}

export function noContent(init?: ResponseInit) {
  return new NextResponse(null, { status: 204, ...init });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(formatErrorBody(message, details), { status: 400 });
}

export function unauthorized(message = 'Unauthorized', details?: unknown) {
  return NextResponse.json(formatErrorBody(message, details), { status: 401 });
}

export function notFound(message = 'Not Found', details?: unknown) {
  return NextResponse.json(formatErrorBody(message, details), { status: 404 });
}

export function serviceUnavailable(message = 'Service Unavailable', details?: unknown) {
  return NextResponse.json(formatErrorBody(message, details), { status: 503 });
}

export function internalError(err: unknown) {
  // Log error with structured logging
  logError('Internal server error', err, {
    type: 'internal_error',
    timestamp: new Date().toISOString(),
  });

  // Send to Sentry for monitoring
  Sentry.captureException(err);

  return NextResponse.json(formatErrorBody('Internal Server Error'), { status: 500 });
}
