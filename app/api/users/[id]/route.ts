import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile, getUserById } from '@/lib/repos/userRepo';
import { validateProfileUpdate } from '@/lib/models/user';
import { internalError, unauthorized, badRequest, notFound } from '@/lib/api/responses';

// Mock authentication until auth system is implemented
const getUserIdFromRequest = (req: NextRequest): string | null => {
  // In a real implementation, this would extract the user ID from the session/token
  // For now, we'll use a header for testing purposes
  return req.headers.get('x-user-id') || null;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Get the user profile
    const user = await getUserById(id);
    if (!user) {
      return notFound('User not found');
    }

    return NextResponse.json(user);
  } catch (error) {
    return internalError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const requestUserId = getUserIdFromRequest(req);

    // Simple authorization check - users can only update their own profiles
    if (!requestUserId || requestUserId !== id) {
      return unauthorized('You can only update your own profile');
    }

    // Parse the request body
    const body = await req.json();

    // Validate the input
    const validation = validateProfileUpdate(body);
    if (!validation.ok) {
      return badRequest('Invalid profile data', validation.issues);
    }

    // Update the profile
    const updatedUser = await updateUserProfile(id, body);

    return NextResponse.json(updatedUser);
  } catch (error) {
    return internalError(error);
  }
}
