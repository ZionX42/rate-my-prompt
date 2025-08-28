import { validateNewPrompt } from '@/lib/models/prompt';

export async function POST(req: Request): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payload = {
    title: body?.title,
    content: body?.content,
    authorId: body?.authorId,
    description: body?.description,
    category: body?.category,
    tags: body?.tags,
    isPublished: body?.isPublished,
  } as any;

  const validation = validateNewPrompt(payload);
  if (!validation.ok) {
    return Response.json({ error: 'Validation failed', issues: validation.issues }, { status: 400 });
  }

  if (!process.env.MONGODB_URI) {
    return Response.json({ error: 'Storage not configured' }, { status: 503 });
  }

  try {
    // Defer importing the Mongo-backed repo until we know storage is configured
    const { createPrompt } = await import('@/lib/repos/promptRepo');
    const created = await createPrompt(payload);
    return Response.json({ prompt: created }, { status: 201 });
  } catch (err: any) {
    if (err?.issues) {
      return Response.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
