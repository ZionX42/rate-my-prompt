import React from 'react';
import Image from 'next/image';
import { PromptModel } from '@/lib/models/prompt';
import { getUserById } from '@/lib/repos/userRepo';
import { listPromptsByAuthor } from '@/lib/repos/promptRepo';
import ProfileEditForm from '@/components/users/ProfileEditForm';
import UserPrompts from '@/components/users/UserPrompts';

// User profile page template
// Tasks 4.1.2 and 4.1.3: Implement profile edit functionality and add prompt collection to user profile
export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Try to fetch the user from the database
  let user = null;
  let userPrompts: PromptModel[] = [];

  try {
    user = await getUserById(id);
    if (user) {
      userPrompts = await listPromptsByAuthor(id);
    }
  } catch (error) {
    console.error('Error fetching user or prompts:', error);
    // Continue rendering with placeholders
  }

  // If no user is found, we still show the UI with placeholders
  const displayName = user?.displayName || `User ${id.slice(0, 6)}`;
  const bio = user?.bio || 'This is the user bio. Tell the world about yourself.';
  const avatarUrl = user?.avatarUrl || '/avatar-placeholder.png';
  const joinedDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US')
    : 'recently';

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-muted">
            <Image
              src={avatarUrl}
              alt={`${displayName}'s avatar`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-heading">{displayName}</h1>
            <p className="text-subtext mt-1">@{id}</p>

            <div className="mt-4 space-y-2">
              <p className="text-body">{bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-subtext">
                <span>Joined {joinedDate}</span>
                <span>Reputation: —</span>
              </div>
            </div>

            {/* Task 4.1.2: Profile Edit Form - rendered as client component */}
            <div className="mt-6">
              <ProfileEditForm
                userId={id}
                initialData={{
                  displayName: user?.displayName || '',
                  bio: user?.bio || '',
                  avatarUrl: user?.avatarUrl || '',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        {/* Tabs placeholder for future subsections */}
        <nav className="border-b border-border mb-4">
          <ul className="flex gap-6 text-sm">
            <li className="pb-3 border-b-2 border-accent-blue text-heading">Prompts</li>
            <li className="pb-3 text-subtext">Activity</li>
            <li className="pb-3 text-subtext">About</li>
          </ul>
        </nav>

        {/* Task 4.1.3: Display user's prompts */}
        <UserPrompts prompts={userPrompts} />
      </section>
    </main>
  );
}
