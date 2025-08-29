"use client";
import React from 'react';

export type CommentFormProps = {
  initial?: string;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: (content: string) => void | Promise<void>;
};

export default function CommentForm({ initial = '', placeholder = 'Write a comment…', submitLabel = 'Post', onCancel, onSubmit }: CommentFormProps) {
  const [content, setContent] = React.useState(initial);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      setSubmitting(true);
      await onSubmit(trimmed);
      setContent('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        className="w-full min-h-[90px] px-3 py-2 rounded-md bg-surface border border-border text-heading placeholder:text-muted"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex gap-3">
        <button type="submit" disabled={submitting || !content.trim()} className="px-4 py-2 rounded-md bg-accent-indigo text-white disabled:opacity-50">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-border text-heading">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
