import { NextRequest } from 'next/server';
import { commentRepo } from '@/lib/repos/commentRepo';
import { ZodError } from 'zod';
import {
  ok,
  created,
  unauthorized,
  serviceUnavailable,
  internalError,
  badRequest,
} from '@/lib/api/responses';
import { requireJson } from '@/lib/api/middleware';
import { InputValidation } from '@/lib/security/validation';

// GET /api/prompts/:id/comments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      return serviceUnavailable('Storage not configured');
    }
    const comments = await commentRepo.getByPromptId(resolvedParams.id);
    return ok(comments);
  } catch (error) {
    return internalError(error);
  }
}

// POST /api/prompts/:id/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      return serviceUnavailable('Storage not configured');
    }
    const guard = requireJson(req);
    if (guard) return guard;
    const data = await req.json();

    // In a real app, userId would come from a session
    if (!data.userId) {
      return unauthorized('userId is required');
    }

    // Validate and sanitize comment content
    if (!data.content || typeof data.content !== 'string') {
      return badRequest('Comment content is required');
    }

    const contentValidation = InputValidation.validateTextContent(data.content, {
      maxLength: 1000,
      minLength: 1,
      allowHtml: false,
    });

    if (!contentValidation.isValid) {
      return badRequest('Comment validation failed: ' + contentValidation.errors.join(', '));
    }

    // Create sanitized data object
    const sanitizedData = {
      ...data,
      content: contentValidation.sanitized,
    };

    const newComment = await commentRepo.create(resolvedParams.id, sanitizedData);
    return created(newComment);
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('Validation failed', error.issues);
    }
    return internalError(error);
  }
}
