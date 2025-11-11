import { useState } from 'react';

export interface PromptFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
}

export interface PromptFormErrors {
  title?: string;
  content?: string;
  category?: string;
  tags?: string;
  general?: string;
}

export function usePromptForm(initialData?: Partial<PromptFormData>) {
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    content: '',
    category: '',
    tags: [],
    isPublic: true,
    ...initialData,
  });

  const [errors, setErrors] = useState<PromptFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (
    field: keyof PromptFormData,
    value: PromptFormData[keyof PromptFormData]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof PromptFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      isPublic: true,
      ...initialData,
    });
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    setErrors,
    setIsSubmitting,
    resetForm,
  };
}
