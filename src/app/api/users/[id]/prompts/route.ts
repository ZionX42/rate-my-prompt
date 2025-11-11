import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listPromptsByAuthor } from '@/lib/repos/promptRepo';
import { hasPermission, Permission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: requestedUserId } = await params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');

    // Check if user can view these prompts
    const canViewAllPrompts = hasPermission(currentUser.role, Permission.MANAGE_USERS);
    const canViewOwnPrompts = currentUser._id === requestedUserId;

    if (!canViewAllPrompts && !canViewOwnPrompts) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch prompts
    const prompts = await listPromptsByAuthor(requestedUserId, limit);

    return NextResponse.json({
      prompts,
      total: prompts.length,
    });
  } catch (error) {
    console.error('Error fetching user prompts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
