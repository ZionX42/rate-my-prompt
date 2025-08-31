import { validateNewPrompt } from '@/lib/models/prompt';
import { NextRequest } from 'next/server';
import { created as createdResp, badRequest, serviceUnavailable, internalError } from '@/lib/api/responses';
import { requireJson } from '@/lib/api/middleware';

export async function POST(req: NextRequest): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const guard = requireJson(req);
  if (guard) return guard;

  const payload = {
    title: body?.title,
    content: body?.content,
    authorId: body?.authorId,
    description: body?.description,
    category: body?.category,
    tags: body?.tags,
    isPublished: body?.isPublished,
  } as any;

  const validation = validateNewPrompt(payload);
  if (!validation.ok) {
    return badRequest('Validation failed', validation.issues);
  }

  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return serviceUnavailable('Storage not configured');
  }

  try {
    // Defer importing the Appwrite-backed repo until we know storage is configured
    const { createPrompt } = await import('@/lib/repos/promptRepo');
  const createdPrompt = await createPrompt(payload);
  return createdResp({ prompt: createdPrompt });
  } catch (err: any) {
    if (err?.issues) {
      return badRequest('Validation failed', err.issues);
    }
    return internalError(err);
  }
}
