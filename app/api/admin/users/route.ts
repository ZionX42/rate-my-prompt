import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/appwrite/collections';
import { Permission } from '@/lib/permissions';
import { currentUserHasPermission } from '@/lib/auth';
import { Role } from '@/lib/models/user';
import { Query } from '@/lib/appwrite/sdk';

export async function GET() {
  try {
    // Check permission
    const hasPermission = await currentUserHasPermission(Permission.MANAGE_USERS);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
    // Check permission
    const hasPermission = await currentUserHasPermission(Permission.MANAGE_USERS);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
    const updateData: any = { role };
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
