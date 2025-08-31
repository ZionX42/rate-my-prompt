import { NextRequest } from 'next/server';
import { commentRepo } from '@/lib/repos/commentRepo';
import { ZodError } from 'zod';
import { ok, noContent, unauthorized, serviceUnavailable, internalError, badRequest, notFound } from '@/lib/api/responses';
import { requireJson } from '@/lib/api/middleware';

// PATCH /api/prompts/:id/comments/:commentId
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      return serviceUnavailable('Storage not configured');
    }
    const guard = requireJson(req);
    if (guard) return guard;
    const { content, userId } = await req.json();
    // In a real app, userId would come from a session
    if (!userId) {
      return unauthorized('userId is required');
    }

    const updatedComment = await commentRepo.update(
      params.commentId,
      userId,
      { content }
    );

    if (!updatedComment) {
      return notFound('Comment not found or user not authorized');
    }

    return ok(updatedComment);
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest('Validation failed', error.issues);
    }
    return internalError(error);
  }
}

// DELETE /api/prompts/:id/comments/:commentId
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      return serviceUnavailable('Storage not configured');
    }
    // In a real app, userId would come from a session
    const { userId } = await req.json();
    if (!userId) {
      return unauthorized('userId is required');
    }

    const success = await commentRepo.softDelete(params.commentId, userId);

    if (!success) {
      return notFound('Comment not found or user not authorized');
    }

    return noContent();
  } catch (error) {
    return internalError(error);
  }
}
