'use client';

import React, { useState } from 'react';

export interface StarRatingProps {
  /** Current rating value (1-5) */
  value?: number;
  /** Whether the rating is read-only */
  readOnly?: boolean;
  /** Size of the stars */
  size?: 'small' | 'medium' | 'large';
  /** Show rating value as text */
  showValue?: boolean;
  /** Callback when rating changes */
  // eslint-disable-next-line no-unused-vars
  onChange?: (value: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export function StarRating({
  value = 0,
  readOnly = false,
  size = 'medium',
  showValue = false,
  onChange,
  className = '',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const handleStarClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleStarHover = (rating: number) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            className={`
              ${sizeClasses[size]} 
              ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-all duration-150 disabled:cursor-default
            `}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`
                w-full h-full transition-colors duration-150
                ${
                  star <= displayValue
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
                }
              `}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>

      {showValue && value > 0 && (
        <span className="text-sm text-gray-600 ml-1">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

export interface RatingSubmissionProps {
  /** Prompt ID to submit rating for */
  promptId: string;
  /** User ID submitting the rating */
  userId: string;
  /** Existing rating value */
  existingRating?: number;
  /** Existing comment */
  existingComment?: string;
  /** Callback when rating is submitted */
  // eslint-disable-next-line no-unused-vars
  onSubmit?: (data: { rating: number; comment?: string }) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

export function RatingSubmission({
  promptId,
  userId,
  existingRating = 0,
  existingComment = '',
  onSubmit,
  isSubmitting = false,
}: RatingSubmissionProps) {
  const [rating, setRating] = useState(existingRating);
  const [comment, setComment] = useState(existingComment);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const payload = {
        userId,
        rating,
        comment: comment.trim() || undefined,
      };

      const response = await fetch(`/api/prompts/${promptId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Rating submitted successfully!');
        if (onSubmit) {
          onSubmit({ rating, comment: comment.trim() || undefined });
        }
      } else {
        setError(data.error || 'Failed to submit rating');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-heading mb-2">Your Rating</label>
        <StarRating value={rating} onChange={setRating} size="large" className="mb-1" />
        {rating > 0 && (
          <p className="text-xs text-gray-500">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-heading mb-2">
          Comment (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-xl bg-surface border border-border px-3 py-2 outline-none resize-vertical"
          placeholder="Share your thoughts about this prompt..."
        />
        <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
      </div>

      {error && (
        <div className="text-red-500 text-sm" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-500 text-sm" role="status">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="cta cta--blue hover-glow-blue disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : existingRating > 0 ? 'Update Rating' : 'Submit Rating'}
      </button>
    </form>
  );
}
