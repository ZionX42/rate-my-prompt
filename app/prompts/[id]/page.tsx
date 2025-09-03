import React from 'react';
import { notFound } from 'next/navigation';
import { PromptModel } from '@/lib/models/prompt';
import { RatingStats } from '@/lib/models/rating';
import { StarRating, RatingSubmission } from '@/components/ratings/StarRating';
import Comments from '@/components/comments/Comments';

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

async function fetchRatingStats(promptId: string): Promise<RatingStats | null> {
  if (!process.env.MONGODB_URI) {
    return null;
  }

  try {
    const { ratingRepo } = await import('@/lib/repos/ratingRepo');
    return await ratingRepo.getRatingStats(promptId);
  } catch (err) {
    console.error('Error fetching rating stats:', err);
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

  const ratingStats = await fetchRatingStats(params.id);

  return (
    <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-xl mb-4">{prompt.title}</h1>
          {prompt.description && <p className="text-lg muted mb-4">{prompt.description}</p>}

          {/* Rating Summary */}
          {ratingStats && ratingStats.totalRatings > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <StarRating value={ratingStats.averageRating} readOnly size="medium" showValue />
              <span className="text-sm text-gray-600">
                ({ratingStats.totalRatings} rating{ratingStats.totalRatings !== 1 ? 's' : ''})
              </span>
            </div>
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

        {/* Rating Section */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-heading mb-4">Rate This Prompt</h3>

          {/* Rating Statistics */}
          {ratingStats && ratingStats.totalRatings > 0 && (
            <div className="mb-6 p-4 bg-surface rounded-xl border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-heading">
                    {ratingStats.averageRating.toFixed(1)}
                  </div>
                  <StarRating value={ratingStats.averageRating} readOnly size="medium" />
                  <div className="text-sm text-gray-600 mt-1">
                    {ratingStats.totalRatings} rating{ratingStats.totalRatings !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-medium text-heading mb-2">Rating Distribution</h4>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-2">{star}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width:
                              ratingStats.totalRatings > 0
                                ? `${(ratingStats.ratingDistribution[star as keyof typeof ratingStats.ratingDistribution] / ratingStats.totalRatings) * 100}%`
                                : '0%',
                          }}
                        />
                      </div>
                      <span className="text-xs w-6 text-right">
                        {
                          ratingStats.ratingDistribution[
                            star as keyof typeof ratingStats.ratingDistribution
                          ]
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rating Submission Form */}
          <RatingSubmission
            promptId={prompt._id!}
            userId="demo-user" // TODO: Replace with actual user ID from session
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="cta cta--outline">Copy Content</button>
        </div>

        {/* Comments Section */}
        <Comments promptId={prompt._id!} userId="demo-user" />
      </div>
    </main>
  );
}
