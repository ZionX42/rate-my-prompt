import { NextRequest } from 'next/server';
import { commentRepo } from '@/lib/repos/commentRepo';
import { ZodError } from 'zod';
import { ok, created, unauthorized, serviceUnavailable, internalError, badRequest } from '@/lib/api/responses';
import { requireJson } from '@/lib/api/middleware';

// GET /api/prompts/:id/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      return serviceUnavailable('Storage not configured');
    }
    const comments = await commentRepo.getByPromptId(params.id);
    return ok(comments);
  } catch (error) {
    return internalError(error);
  }
}

// POST /api/prompts/:id/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const newComment = await commentRepo.create(params.id, data);
    return created(newComment);
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('Validation failed', error.issues);
    }
    return internalError(error);
  }
}
