import { NextResponse } from 'next/server';
type ResponseInit = ConstructorParameters<typeof Response>[1];

// Unified error body formatter. Always returns { error, details? } and, for backward compatibility,
// adds an `issues` alias when details looks like a Zod-style issues array.
function formatErrorBody(message: string, details?: unknown) {
  const body: any = { error: message };
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
  return NextResponse.json(data as any, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data as any, { status: 201, ...init });
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
  console.error(err);
  return NextResponse.json(formatErrorBody('Internal Server Error'), { status: 500 });
}
