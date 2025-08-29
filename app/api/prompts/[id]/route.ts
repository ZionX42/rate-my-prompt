import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'Invalid prompt ID' }, { status: 400 });
  }

  if (!process.env.MONGODB_URI) {
    return Response.json({ error: 'Storage not configured' }, { status: 503 });
  }

  try {
    // Defer importing the Mongo-backed repo until we know storage is configured
    const { getPromptById } = await import('@/lib/repos/promptRepo');
    const prompt = await getPromptById(id);
    
    if (!prompt) {
      return Response.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return Response.json({ prompt }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching prompt:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
