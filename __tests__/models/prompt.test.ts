import { describe, it, expect } from '@jest/globals';
import { validateNewPrompt, sanitizeNewPrompt } from '../../lib/models/prompt';

describe('Prompt model validation', () => {
  it('rejects missing required fields', () => {
    const res = validateNewPrompt({});
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.path === 'title')).toBe(true);
    expect(res.issues.some((i) => i.path === 'content')).toBe(true);
    expect(res.issues.some((i) => i.path === 'authorId')).toBe(true);
  });

  it('accepts valid input', () => {
    const res = validateNewPrompt({ title: 'My Prompt', content: 'This is a valid prompt content', authorId: 'user_1' });
    expect(res.ok).toBe(true);
  });

  it('sanitizes defaults and trims fields', () => {
    const cleaned = sanitizeNewPrompt({
      title: '  Title  ',
      content: '   some content here   ',
      authorId: 'u1',
      tags: ['  tag1 ', 'tag2', ''],
    });
    expect(cleaned.title).toBe('Title');
    expect(cleaned.content).toBe('some content here');
    expect(cleaned.category).toBe('general');
    expect(cleaned.isPublished).toBe(false);
    expect(cleaned.tags).toEqual(['tag1', 'tag2']);
  });
});
