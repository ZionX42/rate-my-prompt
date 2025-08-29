import React from 'react';
import { notFound } from 'next/navigation';
import { PromptModel } from '@/lib/models/prompt';

type Props = {
  params: { id: string };
};

async function fetchPrompt(id: string): Promise<PromptModel | null> {
  if (!process.env.MONGODB_URI) {
    return null; // Storage not configured
  }

  try {
    const { getPromptById } = await import('@/lib/repos/promptRepo');
    return await getPromptById(id);
  } catch (err) {
    console.error('Error fetching prompt:', err);
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const prompt = await fetchPrompt(params.id);
  
  if (!prompt) {
    return {
      title: 'Prompt Not Found',
    };
  }

  return {
    title: prompt.title,
    description: prompt.description || `Prompt by ${prompt.authorId}`,
  };
}

export default async function PromptDetailPage({ params }: Props) {
  const prompt = await fetchPrompt(params.id);

  if (!prompt) {
    notFound();
  }

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-xl mb-4">{prompt.title}</h1>
          {prompt.description && (
            <p className="text-lg muted mb-4">{prompt.description}</p>
          )}
          
          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm muted">
            <span>By {prompt.authorId}</span>
            <span>•</span>
            <span>Category: {prompt.category}</span>
            <span>•</span>
            <span>Created {new Date(prompt.createdAt).toLocaleDateString()}</span>
            {prompt.isPublished && (
              <>
                <span>•</span>
                <span className="text-accent-green">Published</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-heading mb-4">Prompt Content</h2>
          <div className="bg-surface rounded-xl border border-border p-4">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
              {prompt.content}
            </pre>
          </div>
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold text-heading mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {prompt.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-surface border border-border rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="cta cta--blue hover-glow-blue">
            Rate This Prompt
          </button>
          <button className="cta cta--outline">
            Copy Content
          </button>
        </div>
      </div>
    </main>
  );
}
