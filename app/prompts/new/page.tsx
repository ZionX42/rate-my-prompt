import React from 'react';
import PromptForm from '@/components/prompts/PromptForm';

export const metadata = {
  title: 'Submit a Prompt',
};

export default function NewPromptPage() {
  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <h1 className="heading-xl mb-6">Submit a Prompt</h1>
      <p className="muted max-w-2xl mb-8">
        Share your prompt with the community. Provide a clear title and content. Optionally add a description, category, and tags.
      </p>
      <div className="card p-6">
        <PromptForm />
      </div>
    </main>
  );
}
