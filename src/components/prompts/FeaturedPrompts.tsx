'use client';

import React from 'react';
import Link from 'next/link';
import { PromptModel } from '@/lib/models/prompt';

interface FeaturedPromptsProps {
  prompts: PromptModel[];
}

export default function FeaturedPrompts({ prompts }: FeaturedPromptsProps) {
  if (!prompts || prompts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted">No featured prompts available at the moment.</p>
        <Link
          href="/prompts/new"
          className="text-hfYellow underline underline-offset-4 mt-2 inline-block"
        >
          Submit the first prompt
        </Link>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {prompts.map((prompt) => (
        <div key={prompt._id?.toString()} className="card card-hover p-6 border border-border">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-heading overflow-hidden">
              {prompt.title.length > 50 ? `${prompt.title.substring(0, 50)}...` : prompt.title}
            </h3>
            {prompt.category && (
              <span className="px-2 py-1 text-xs bg-surface rounded-full text-accent-blue capitalize ml-2 flex-shrink-0">
                {prompt.category}
              </span>
            )}
          </div>

          {prompt.description && (
            <p className="text-sm muted mb-4">
              {prompt.description.length > 120
                ? `${prompt.description.substring(0, 120)}...`
                : prompt.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted mb-4">
            <span>By {prompt.authorId}</span>
            <span>{new Date(prompt.createdAt).toLocaleDateString('en-US')}</span>
          </div>

          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {prompt.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-surface/50 rounded text-muted">
                  #{tag}
                </span>
              ))}
              {prompt.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-muted">+{prompt.tags.length - 3} more</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link
              href={`/prompts/${prompt._id}`}
              className="text-hfYellow hover:text-hfYellow/80 font-medium text-sm underline underline-offset-4"
            >
              View Details
            </Link>
            <span className="text-xs text-muted">
              {prompt.content.length > 100
                ? `${prompt.content.substring(0, 100)}...`
                : prompt.content.length}{' '}
              chars
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
