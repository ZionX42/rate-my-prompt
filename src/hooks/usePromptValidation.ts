import { PromptFormData, PromptFormErrors } from './usePromptForm';

export function usePromptValidation() {
  const validate = (formData: PromptFormData): PromptFormErrors => {
    const errors: PromptFormErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.length > 5000) {
      errors.content = 'Content must be 5000 characters or less';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    return errors;
  };

  const mapServerErrorsToForm = (serverErrors: Record<string, string>): PromptFormErrors => {
    const formErrors: PromptFormErrors = {};

    for (const [field, message] of Object.entries(serverErrors)) {
      if (['title', 'content', 'category', 'tags'].includes(field)) {
        formErrors[field as keyof PromptFormErrors] = message;
      } else {
        formErrors.general = message;
      }
    }

    return formErrors;
  };

  return {
    validate,
    mapServerErrorsToForm,
  };
}
