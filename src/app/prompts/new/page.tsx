import React from 'react';
import { redirect } from 'next/navigation';
import PromptForm from '@/components/prompts/PromptForm';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, Permission } from '@/lib/permissions';
import type { NextRequest } from 'next/server';

export const metadata = {
  title: 'Submit a Prompt',
};

export default async function NewPromptPage() {
  // Create a mock request object for getCurrentUser
  const mockRequest = {
    headers: { get: () => undefined },
    cookies: { get: () => undefined },
  } as unknown as NextRequest;

  const user = await getCurrentUser(mockRequest);

  if (!user || !user.isActive) {
    redirect('/login?next=/prompts/new');
  }

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
