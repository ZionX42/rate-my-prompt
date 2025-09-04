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
import { InputValidation } from '@/lib/security/validation';

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

  // Extract and validate input data
  const rawTitle = typeof requestBody?.title === 'string' ? requestBody.title : undefined;
  const rawContent = typeof requestBody?.content === 'string' ? requestBody.content : undefined;
  const rawDescription =
    typeof requestBody?.description === 'string' ? requestBody.description : undefined;
  const rawTags = Array.isArray(requestBody?.tags) ? (requestBody.tags as string[]) : undefined;

  // Validate and sanitize title
  let sanitizedTitle: string | undefined;
  if (rawTitle) {
    const titleValidation = InputValidation.validateTextContent(rawTitle, {
      maxLength: 200,
      minLength: 1,
    });
    if (!titleValidation.isValid) {
      return badRequest('Title validation failed: ' + titleValidation.errors.join(', '));
    }
    sanitizedTitle = titleValidation.sanitized;
  }

  // Validate and sanitize content
  let sanitizedContent: string | undefined;
  if (rawContent) {
    const contentValidation = InputValidation.validateTextContent(rawContent, {
      maxLength: 10000,
      minLength: 10,
      allowHtml: true,
    });
    if (!contentValidation.isValid) {
      return badRequest('Content validation failed: ' + contentValidation.errors.join(', '));
    }
    sanitizedContent = contentValidation.sanitized;
  }

  // Validate and sanitize description
  let sanitizedDescription: string | undefined;
  if (rawDescription) {
    const descriptionValidation = InputValidation.validateTextContent(rawDescription, {
      maxLength: 500,
      allowHtml: false,
    });
    if (!descriptionValidation.isValid) {
      return badRequest(
        'Description validation failed: ' + descriptionValidation.errors.join(', ')
      );
    }
    sanitizedDescription = descriptionValidation.sanitized;
  }

  // Validate and sanitize tags
  let sanitizedTags: string[] | undefined;
  if (rawTags) {
    sanitizedTags = [];
    for (const tag of rawTags) {
      if (typeof tag === 'string') {
        const tagValidation = InputValidation.validateTextContent(tag, {
          maxLength: 50,
          minLength: 1,
          allowHtml: false,
        });
        if (tagValidation.isValid) {
          sanitizedTags.push(tagValidation.sanitized);
        }
      }
    }
    if (sanitizedTags.length !== rawTags.length) {
      return badRequest('Some tags failed validation');
    }
  }

  const payload: Partial<NewPromptInput> = {
    title: sanitizedTitle,
    content: sanitizedContent,
    authorId: typeof requestBody?.authorId === 'string' ? requestBody.authorId : undefined,
    description: sanitizedDescription,
    category:
      typeof requestBody?.category === 'string'
        ? (requestBody.category as PromptCategory)
        : undefined,
    tags: sanitizedTags,
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
