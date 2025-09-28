import React from 'react';
import { redirect } from 'next/navigation';
import PromptForm from '@/components/prompts/PromptForm';
import { SessionManager } from '@/lib/auth/sessionManager';
import { hasPermission, Permission } from '@/lib/permissions';

export const metadata = {
  title: 'Submit a Prompt',
};

export default async function NewPromptPage() {
  const session = await SessionManager.getCurrentSession();

  if (!session.user || !session.isValid) {
    redirect('/login?next=/prompts/new');
  }

  const user = session.user;
  if (!hasPermission(user.role, Permission.CREATE_PROMPT)) {
    redirect('/prompts');
  }

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <h1 className="heading-xl mb-6">Submit a Prompt</h1>
      <p className="muted max-w-2xl mb-8">
        Share your prompt with the community. Provide a clear title and content. Optionally add a
        description, category, and tags.
      </p>
      <div className="card p-6">
        <PromptForm currentUserId={user._id} lockAuthorField />
      </div>
    </main>
  );
}
