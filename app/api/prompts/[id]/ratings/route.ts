import { NextRequest } from 'next/server';
import { validateCreateRating } from '@/lib/models/rating';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { id: promptId } = params;

  if (!promptId || typeof promptId !== 'string') {
    return Response.json({ error: 'Invalid prompt ID' }, { status: 400 });
  }

  if (!process.env.MONGODB_URI) {
    return Response.json({ error: 'Storage not configured' }, { status: 503 });
  }

  try {
    // Parse request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Add promptId to the payload
    const payload = { ...body, promptId };

    // Validate the rating data
    const validatedData = validateCreateRating(payload);

    // Check if prompt exists
    const { getPromptById } = await import('@/lib/repos/promptRepo');
    const prompt = await getPromptById(promptId);
    
    if (!prompt) {
      return Response.json({ error: 'Prompt not found' }, { status: 404 });
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

      if (!updatedRating) {
        return Response.json({ error: 'Failed to update rating' }, { status: 500 });
      }

      return Response.json({ 
        rating: updatedRating,
        message: 'Rating updated successfully'
      }, { status: 200 });
    } else {
      // Create new rating
      const newRating = await ratingRepo.createRating(validatedData);
      
      return Response.json({ 
        rating: newRating,
        message: 'Rating created successfully'
      }, { status: 201 });
    }

  } catch (err: any) {
    console.error('Error processing rating:', err);
    
    // Handle validation errors
    if (err.name === 'ZodError') {
      return Response.json({
        error: 'Validation failed',
        issues: err.issues?.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
      }, { status: 400 });
    }

    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { id: promptId } = params;

  if (!promptId || typeof promptId !== 'string') {
    return Response.json({ error: 'Invalid prompt ID' }, { status: 400 });
  }

  if (!process.env.MONGODB_URI) {
    return Response.json({ error: 'Storage not configured' }, { status: 503 });
  }

  try {
    // Get rating statistics for the prompt
    const { ratingRepo } = await import('@/lib/repos/ratingRepo');
    const stats = await ratingRepo.getRatingStats(promptId);
    const ratings = await ratingRepo.getRatingsByPromptId(promptId);
    
    return Response.json({ 
      stats,
      ratings: ratings.map(rating => ({
        _id: rating._id,
        rating: rating.rating,
        comment: rating.comment,
        userId: rating.userId,
        createdAt: rating.createdAt,
      }))
    }, { status: 200 });

  } catch (err: any) {
    console.error('Error fetching ratings:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
