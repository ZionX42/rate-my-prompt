'use client';
import React, { useMemo, useState } from 'react';
import { type PromptCategory } from '@/lib/models/prompt';

type FormState = {
  title: string;
  content: string;
  authorId: string;
  description: string;
  category: PromptCategory;
  tags: string; // comma-separated input
  isPublished: boolean;
};

type SubmitResult =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; id?: string }
  | { status: 'error'; message: string; issues?: { path: string; message: string }[] };

export function PromptForm() {
  const [form, setForm] = useState<FormState>({
    title: '',
    content: '',
    authorId: '',
    description: '',
    category: 'general',
    tags: '',
    isPublished: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult>({ status: 'idle' });

  const categories: PromptCategory[] = useMemo(
    () => ['general', 'coding', 'writing', 'design', 'marketing', 'data', 'other'],
    []
  );

  function validateClient(): boolean {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters.';
    if (form.content.trim().length < 10) next.content = 'Content must be at least 10 characters.';
    if (!form.authorId.trim()) next.authorId = 'authorId is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateClient()) return;

    setResult({ status: 'submitting' });
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        authorId: form.authorId.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPublished: form.isPublished,
      };

      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverIssues = Array.isArray(data?.details)
          ? data.details
          : Array.isArray(data?.issues)
            ? data.issues
            : undefined;
        setResult({
          status: 'error',
          message: data?.error || 'Submission failed',
          issues: serverIssues,
        });
        if (Array.isArray(serverIssues)) {
          const serverErrors: Record<string, string> = {};
          for (const i of serverIssues) serverErrors[i.path] = i.message;
          setErrors(serverErrors);
        }
        return;
      }

      setResult({ status: 'success', id: data?.prompt?._id || data?.prompt?.id });
      setErrors({});
      // Keep form values so user can see what was submitted; optional reset below
      // setForm({ ...form, title: '', content: '', description: '', tags: '' });
    } catch {
      setResult({ status: 'error', message: 'Network error' });
    }
  }

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-heading">
          Title
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent-blue/60"
          placeholder="e.g., SEO Blog Post Generator"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-heading">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          value={form.content}
          onChange={(e) => onChange('content', e.target.value)}
          className="mt-1 w-full min-h-[140px] rounded-xl bg-surface border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent-pink/60"
          placeholder="Paste your prompt here..."
        />
        {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="authorId" className="block text-sm font-medium text-heading">
            Author ID
          </label>
          <input
            id="authorId"
            name="authorId"
            value={form.authorId}
            onChange={(e) => onChange('authorId', e.target.value)}
            className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-accent-green/60"
            placeholder="your-user-id"
          />
          {errors.authorId && <p className="mt-1 text-sm text-red-500">{errors.authorId}</p>}
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-heading">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={(e) => onChange('category', e.target.value as PromptCategory)}
            className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-heading">
          Description
        </label>
        <input
          id="description"
          name="description"
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 outline-none"
          placeholder="Short description (optional)"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-heading">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            value={form.tags}
            onChange={(e) => onChange('tags', e.target.value)}
            className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 outline-none"
            placeholder="comma,separated,tags"
          />
        </div>
        <div className="flex items-center pt-6">
          <label className="inline-flex items-center gap-2 text-sm text-heading">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => onChange('isPublished', e.target.checked)}
              className="rounded border-border"
            />
            Publish immediately
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={result.status === 'submitting'}
          className="cta cta--blue hover-glow-blue disabled:opacity-60"
        >
          {result.status === 'submitting' ? 'Submitting…' : 'Submit Prompt'}
        </button>
        {result.status === 'error' && (
          <span role="alert" className="text-sm text-red-500">
            {result.message}
          </span>
        )}
        {result.status === 'success' && (
          <span role="status" className="text-sm text-accent-green">
            Submitted! ID: {result.id || 'created'}
          </span>
        )}
      </div>
    </form>
  );
}

export default PromptForm;
