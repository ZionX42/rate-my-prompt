import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import ProfileDashboard from '@/components/users/ProfileDashboard';
import { SessionManager } from '@/lib/auth/sessionManager';
import { listPromptsByAuthor } from '@/lib/repos/promptRepo';
import { hasPermission, Permission } from '@/lib/permissions';
import type { PromptModel } from '@/lib/models/prompt';

export const metadata = {
  title: 'My Profile',
};

export default async function ProfilePage() {
  const session = await SessionManager.getCurrentSession();

  if (!session.user || !session.isValid) {
    redirect('/login?next=/profile');
  }

  const user = session.user;

  let prompts: PromptModel[] = [];
  try {
    prompts = await listPromptsByAuthor(user._id, 25);
  } catch (error) {
    console.error('Failed to load user prompts for profile page:', error);
  }

  const serializedPrompts = prompts.map((prompt) => ({
    ...prompt,
    createdAt: prompt.createdAt instanceof Date ? prompt.createdAt.toISOString() : prompt.createdAt,
    updatedAt: prompt.updatedAt instanceof Date ? prompt.updatedAt.toISOString() : prompt.updatedAt,
  }));

  const profilePayload = {
    id: user._id,
    displayName: user.displayName,
    email: user.email ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    joinedAt: user.joinedAt instanceof Date ? user.joinedAt.toISOString() : String(user.joinedAt),
    updatedAt:
      user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
  };

  const canEdit = hasPermission(user.role, Permission.EDIT_OWN_PROFILE);

  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-10 text-subtext">Loading profile…</div>}
    >
      <ProfileDashboard user={profilePayload} prompts={serializedPrompts} canEdit={canEdit} />
    </Suspense>
  );
}
