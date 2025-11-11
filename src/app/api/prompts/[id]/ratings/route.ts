import { NextRequest } from 'next/server';
import { validateCreateRating } from '@/lib/models/rating';
import {
  ok,
  created as createdResp,
  badRequest,
  notFound,
  serviceUnavailable,
  internalError,
} from '@/lib/api/responses';
import { requireJson } from '@/lib/api/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id: promptId } = await params;

  if (!promptId || typeof promptId !== 'string') {
    return badRequest('Invalid prompt ID');
  }

  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return serviceUnavailable('Storage not configured');
  }

  try {
    // Parse request body
    const guard = requireJson(req);
    if (guard) return guard;
    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON payload');

    // Add promptId to the payload
    const payload = { ...body, promptId };

    // Validate the rating data
    const validatedData = validateCreateRating(payload);

    // Check if prompt exists
    const { getPromptById } = await import('@/lib/repos/promptRepo');
    const prompt = await getPromptById(promptId);

    if (!prompt) {
      return notFound('Prompt not found');
    }

    // Check if user already rated this prompt
    const { ratingRepo } = await import('@/lib/repos/ratingRepo');
    const existingRating = await ratingRepo.getRatingByUserAndPrompt(
      validatedData.userId,
      promptId
    );

    if (existingRating) {
      // Update existing rating
      const updatedRating = await ratingRepo.updateRating(existingRating._id!, {
        rating: validatedData.rating,
        comment: validatedData.comment,
      });

      if (!updatedRating) return internalError('Failed to update rating');

      return ok({ rating: updatedRating, message: 'Rating updated successfully' });
    } else {
      // Create new rating
      const newRating = await ratingRepo.createRating(validatedData);
      return createdResp({ rating: newRating, message: 'Rating created successfully' });
    }
  } catch (err: unknown) {
    // Handle validation errors
    if (err instanceof Error && err.name === 'ZodError') {
      const zodError = err as { issues?: Array<{ path: string[]; message: string }> };
      const issues = zodError.issues?.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return badRequest('Validation failed', issues);
    }
    return internalError(err);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id: promptId } = await params;

  if (!promptId || typeof promptId !== 'string') {
    return badRequest('Invalid prompt ID');
  }

  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return serviceUnavailable('Storage not configured');
  }

  try {
    // Get rating statistics for the prompt
    const { ratingRepo } = await import('@/lib/repos/ratingRepo');
    const stats = await ratingRepo.getRatingStats(promptId);
    const ratings = await ratingRepo.getRatingsByPromptId(promptId);

    return ok({
      stats,
      ratings: ratings.map((rating) => ({
        _id: rating._id,
        rating: rating.rating,
        comment: rating.comment,
        userId: rating.userId,
        createdAt: rating.createdAt,
      })),
    });
  } catch (err: unknown) {
    return internalError(err);
  }
}
