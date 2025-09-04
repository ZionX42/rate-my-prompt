import { NextRequest } from 'next/server';
import { ok, badRequest, notFound, serviceUnavailable, internalError } from '@/lib/api/responses';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  if (!id || typeof id !== 'string') {
    return badRequest('Invalid prompt ID');
  }

  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    return serviceUnavailable('Storage not configured');
  }

  try {
    // Defer importing the Appwrite-backed repo until we know storage is configured
    const { getPromptById } = await import('@/lib/repos/promptRepo');
    const prompt = await getPromptById(id);

    if (!prompt) {
      return notFound('Prompt not found');
    }

    return ok({ prompt });
  } catch (err) {
    return internalError(err);
  }
}
