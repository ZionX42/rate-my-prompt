import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/appwrite/collections';
import { Permission } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { Role } from '@/lib/models/user';
import { Query } from '@/lib/appwrite/sdk';

export async function GET(request: NextRequest) {
  try {
    // Check permission using Appwrite session
    const user = await getCurrentUser(request);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasManagePermission = hasPermission(user.role, Permission.MANAGE_USERS);
    if (!hasManagePermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { users } = await getCollections();

    // Get all users (in production, add pagination)
    const result = await users.list([Query.limit(100)]);

    return NextResponse.json({
      users: result.documents,
      total: result.total,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission using Appwrite session
    const user = await getCurrentUser(request);
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasManagePermission = hasPermission(user.role, Permission.MANAGE_USERS);
    if (!hasManagePermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { users } = await getCollections();

    // Update user
    const updateData: Partial<{ role: string; isActive: boolean }> = { role };
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const result = await users.update(userId, updateData);

    return NextResponse.json({ user: result });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
