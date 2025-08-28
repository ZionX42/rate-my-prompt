export type PromptCategory =
  | 'general'
  | 'coding'
  | 'writing'
  | 'design'
  | 'marketing'
  | 'data'
  | 'other';

export interface NewPromptInput {
  title: string;
  content: string;
  authorId: string;
  description?: string;
  category?: PromptCategory;
  tags?: string[];
  isPublished?: boolean;
}

export interface PromptModel extends NewPromptInput {
  _id?: any;
  createdAt: Date;
  updatedAt: Date;
}

export type ValidationIssue = { path: string; message: string };

export function validateNewPrompt(input: Partial<NewPromptInput>): {
  ok: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (!input.title || typeof input.title !== 'string' || input.title.trim().length < 3) {
    issues.push({ path: 'title', message: 'Title must be at least 3 characters.' });
  }
  if (!input.content || typeof input.content !== 'string' || input.content.trim().length < 10) {
    issues.push({ path: 'content', message: 'Content must be at least 10 characters.' });
  }
  if (!input.authorId || typeof input.authorId !== 'string') {
    issues.push({ path: 'authorId', message: 'authorId is required.' });
  }

  if (input.category && !isPromptCategory(input.category)) {
    issues.push({ path: 'category', message: 'Invalid category.' });
  }

  if (input.tags) {
    const tagsValid = Array.isArray(input.tags) && input.tags.every((t) => typeof t === 'string');
    if (!tagsValid) issues.push({ path: 'tags', message: 'tags must be an array of strings.' });
  }

  return { ok: issues.length === 0, issues };
}

export function sanitizeNewPrompt(input: NewPromptInput): NewPromptInput {
  return {
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    description: input.description?.trim(),
    category: input.category ?? 'general',
    tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean),
    isPublished: input.isPublished ?? false,
  };
}

export function isPromptCategory(x: any): x is PromptCategory {
  return (
    x === 'general' ||
    x === 'coding' ||
    x === 'writing' ||
    x === 'design' ||
    x === 'marketing' ||
    x === 'data' ||
    x === 'other'
  );
}
