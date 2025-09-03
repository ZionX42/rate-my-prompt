import {
  sanitizeText,
  sanitizePromptContent,
  sanitizeTags,
  detectMaliciousPatterns,
} from '@/lib/security/sanitize';

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
  _id?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type ValidationIssue = { path: string; message: string };

// Helper function to validate string fields - DRY principle
function validateStringField(
  value: unknown,
  fieldName: string,
  minLength: number,
  required: boolean = true
): ValidationIssue | null {
  if (!value) {
    return required ? { path: fieldName, message: `${fieldName} is required.` } : null;
  }

  if (typeof value !== 'string') {
    return { path: fieldName, message: `${fieldName} must be a string.` };
  }

  if (value.trim().length < minLength) {
    return { path: fieldName, message: `${fieldName} must be at least ${minLength} characters.` };
  }

  return null;
}

// Helper function to validate optional category
function validateCategory(category: unknown): ValidationIssue | null {
  if (!category) return null;

  if (!isPromptCategory(category)) {
    return { path: 'category', message: 'Invalid category.' };
  }

  return null;
}

// Helper function to validate optional tags array
function validateTags(tags: unknown): ValidationIssue | null {
  if (!tags) return null;

  const isValidTagsArray = Array.isArray(tags) && tags.every((t) => typeof t === 'string');
  if (!isValidTagsArray) {
    return { path: 'tags', message: 'tags must be an array of strings.' };
  }

  return null;
}

export function validateNewPrompt(input: Partial<NewPromptInput>): {
  ok: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  // Validate required string fields
  const titleIssue = validateStringField(input.title, 'title', 3);
  const contentIssue = validateStringField(input.content, 'content', 10);
  const authorIdIssue = validateStringField(input.authorId, 'authorId', 1);

  // Validate optional fields
  const categoryIssue = validateCategory(input.category);
  const tagsIssue = validateTags(input.tags);

  // Collect all issues
  [titleIssue, contentIssue, authorIdIssue, categoryIssue, tagsIssue]
    .filter(Boolean)
    .forEach((issue) => issues.push(issue!));

  return { ok: issues.length === 0, issues };
}

export function sanitizeNewPrompt(input: NewPromptInput): NewPromptInput {
  // Check for malicious patterns
  if (detectMaliciousPatterns(input.title) || detectMaliciousPatterns(input.content)) {
    throw new Error('Potentially malicious content detected');
  }

  return {
    ...input,
    title: sanitizeText(input.title, { maxLength: 200 }),
    content: sanitizePromptContent(input.content),
    description: input.description
      ? sanitizeText(input.description, { maxLength: 500 })
      : undefined,
    category: input.category ?? 'general',
    tags: sanitizeTags(input.tags ?? []),
    isPublished: input.isPublished ?? false,
  };
}

export function isPromptCategory(x: unknown): x is PromptCategory {
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
