import { NextResponse } from 'next/server';
import { commentRepo } from '@/lib/repos/commentRepo';
import { ZodError } from 'zod';

// GET /api/prompts/:id/comments
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    const comments = await commentRepo.getByPromptId(params.id);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/prompts/:id/comments
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 503 });
    }
    const data = await req.json();
    // In a real app, userId would come from a session
    if (!data.userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 401 });
    }
    const newComment = await commentRepo.create(params.id, data);
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
