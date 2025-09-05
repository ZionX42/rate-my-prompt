'use client';

import React from 'react';
import Link from 'next/link';
import { PromptModel } from '@/lib/models/prompt';

interface UserPromptsProps {
  prompts: PromptModel[];
}

export default function UserPrompts({ prompts }: UserPromptsProps) {
  if (!prompts || prompts.length === 0) {
    return (
      <div className="py-8 text-center text-subtext">
        <p>This user hasn&apos;t created any prompts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {prompts.map((prompt) => (
          <div
            key={prompt._id}
            className="card border border-border p-4 hover:border-accent-blue transition-colors"
          >
            <Link href={`/prompts/${prompt._id}`} className="block">
              <h3 className="font-medium text-heading">{prompt.title}</h3>

              <p className="text-sm text-subtext mt-2 line-clamp-2">
                {prompt.description || prompt.content.substring(0, 120)}
              </p>

              <div className="flex items-center justify-between mt-4 text-xs text-subtext">
                <span>{new Date(prompt.createdAt).toLocaleDateString('en-US')}</span>
                <span className="px-2 py-1 bg-muted rounded-full">{prompt.category}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
