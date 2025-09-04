import { validateNewPrompt, NewPromptInput, PromptCategory } from '@/lib/models/prompt';
import { NextRequest } from 'next/server';
import {
  created as createdResp,
  badRequest,
  serviceUnavailable,
  internalError,
} from '@/lib/api/responses';
import { requireJson, logRequest } from '@/lib/api/middleware';
import { logUserAction } from '@/lib/logger';
import { validateServerConfig } from '@/lib/config/server';

export async function POST(req: NextRequest): Promise<Response> {
  // Log the API request
  logRequest(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const guard = requireJson(req);
  if (guard) return guard;

  // Type assertion for request body
  const requestBody = body as Record<string, unknown>;

  const payload: Partial<NewPromptInput> = {
    title: typeof requestBody?.title === 'string' ? requestBody.title : undefined,
    content: typeof requestBody?.content === 'string' ? requestBody.content : undefined,
    authorId: typeof requestBody?.authorId === 'string' ? requestBody.authorId : undefined,
    description: typeof requestBody?.description === 'string' ? requestBody.description : undefined,
    category:
      typeof requestBody?.category === 'string'
        ? (requestBody.category as PromptCategory)
        : undefined,
    tags: Array.isArray(requestBody?.tags) ? (requestBody.tags as string[]) : undefined,
    isPublished:
      typeof requestBody?.isPublished === 'boolean' ? requestBody.isPublished : undefined,
  };

  const validation = validateNewPrompt(payload);
  if (!validation.ok) {
    return badRequest('Validation failed', validation.issues);
  }

  // Validate server configuration
  try {
    validateServerConfig();
  } catch (error) {
    console.error('Server configuration validation failed:', error);
    return serviceUnavailable('Server configuration error');
  }

  try {
    // Defer importing the Appwrite-backed repo until we know storage is configured
    const { createPrompt } = await import('@/lib/repos/promptRepo');
    const createdPrompt = await createPrompt(payload as NewPromptInput);

    // Log the user action
    logUserAction('prompt_created', String(payload.authorId), {
      promptId: createdPrompt._id,
      title: createdPrompt.title,
      category: createdPrompt.category,
    });

    return createdResp({ prompt: createdPrompt });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'issues' in err) {
      return badRequest('Validation failed', (err as { issues: unknown }).issues);
    }
    return internalError(err);
  }
}
