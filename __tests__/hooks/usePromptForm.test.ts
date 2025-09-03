import { renderHook, act } from '@testing-library/react';
import { expect } from '@jest/globals';
import '@testing-library/jest-dom';
import { usePromptForm } from '@/hooks/usePromptForm';
import type { PromptFormData } from '@/hooks/usePromptForm';

describe('usePromptForm', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePromptForm());

    expect(result.current.formData).toEqual({
      title: '',
      content: '',
      category: '',
      tags: [],
      isPublic: true,
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should initialize with provided initial data', () => {
    const initialData: Partial<PromptFormData> = {
      title: 'Initial Title',
      category: 'technical',
    };
    const { result } = renderHook(() => usePromptForm(initialData));

    expect(result.current.formData.title).toBe('Initial Title');
    expect(result.current.formData.category).toBe('technical');
    expect(result.current.formData.content).toBe('');
  });

  it('should update a field value', () => {
    const { result } = renderHook(() => usePromptForm());

    act(() => {
      result.current.updateField('title', 'New Title');
    });

    expect(result.current.formData.title).toBe('New Title');
  });

  it('should clear the error for a field when it is updated', () => {
    const { result } = renderHook(() => usePromptForm());

    act(() => {
      result.current.setErrors({ title: 'An error' });
    });

    expect(result.current.errors.title).toBe('An error');

    act(() => {
      result.current.updateField('title', 'A new value');
    });

    expect(result.current.errors.title).toBeUndefined();
  });

  it('should set errors', () => {
    const { result } = renderHook(() => usePromptForm());
    const newErrors = { title: 'Title is required', content: 'Content is too short' };

    act(() => {
      result.current.setErrors(newErrors);
    });

    expect(result.current.errors).toEqual(newErrors);
  });

  it('should set submitting state', () => {
    const { result } = renderHook(() => usePromptForm());

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);

    act(() => {
      result.current.setIsSubmitting(false);
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('should reset the form to its initial state', () => {
    const initialData = { title: 'Initial Title' };
    const { result } = renderHook(() => usePromptForm(initialData));

    act(() => {
      result.current.updateField('content', 'Some content');
      result.current.setErrors({ title: 'An error' });
      result.current.setIsSubmitting(true);
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual({
      title: 'Initial Title',
      content: '',
      category: '',
      tags: [],
      isPublic: true,
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });
});
