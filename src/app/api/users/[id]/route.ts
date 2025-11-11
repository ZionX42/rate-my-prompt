import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile, getUserById } from '@/lib/repos/userRepo';
import { validateProfileUpdate } from '@/lib/models/user';
import { internalError, unauthorized, badRequest, notFound } from '@/lib/api/responses';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, Permission, canManageUser } from '@/lib/permissions';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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
    const { id } = await params;
    const currentUser = await getCurrentUser(req);

    if (!currentUser || !currentUser.isActive) {
      return unauthorized('Authentication required');
    }

    const actor = currentUser;
    const targetUser = await getUserById(id);

    if (!targetUser) {
      return notFound('User not found');
    }

    const isEditingSelf = actor._id === targetUser._id;

    if (isEditingSelf) {
      if (!hasPermission(actor.role, Permission.EDIT_OWN_PROFILE)) {
        return unauthorized('You do not have permission to edit your profile');
      }
    } else {
      if (!canManageUser(actor.role, targetUser.role)) {
        return unauthorized('You do not have permission to update this user');
      }
    }

    // Parse the request body
    const body = await req.json();

    const allowedFields = new Set(['displayName', 'bio', 'avatarUrl']);
    const filteredBody = Object.keys(body).reduce<Record<string, unknown>>((acc, key) => {
      if (allowedFields.has(key)) {
        acc[key] = body[key];
      }
      return acc;
    }, {});

    if (Object.keys(filteredBody).length === 0) {
      return badRequest('No editable fields provided');
    }

    // Validate the input
    const validation = validateProfileUpdate(filteredBody);
    if (!validation.ok) {
      return badRequest('Invalid profile data', validation.issues);
    }

    // Update the profile
    const updatedUser = await updateUserProfile(id, filteredBody);

    return NextResponse.json(updatedUser);
  } catch (error) {
    return internalError(error);
  }
}
