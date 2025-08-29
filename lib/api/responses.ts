import { NextResponse } from 'next/server';
type ResponseInit = ConstructorParameters<typeof Response>[1];

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
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function notFound(message = 'Not Found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serviceUnavailable(message = 'Service Unavailable') {
  return NextResponse.json({ error: message }, { status: 503 });
}

export function internalError(err: unknown) {
  console.error(err);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
