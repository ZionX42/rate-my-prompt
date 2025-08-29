import { NextResponse } from 'next/server';
import { commentRepo } from '@/lib/repos/commentRepo';
import { ZodError } from 'zod';

// PATCH /api/prompts/:id/comments/:commentId
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    const { content, userId } = await req.json();
    // In a real app, userId would come from a session
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 401 });
    }

    const updatedComment = await commentRepo.update(
      params.commentId,
      userId,
      { content }
    );

    if (!updatedComment) {
      return NextResponse.json(
        { error: 'Comment not found or user not authorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedComment);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/prompts/:id/comments/:commentId
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    // In a real app, userId would come from a session
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 401 });
    }

    const success = await commentRepo.softDelete(params.commentId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Comment not found or user not authorized' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
