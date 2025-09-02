import { PromptFormData } from './usePromptForm';

export function usePromptSubmission() {
  const submitPrompt = async (formData: PromptFormData) => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create prompt');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const navigateToPrompt = (promptId: string) => {
    window.location.href = `/prompts/${promptId}`;
  };

  return {
    submitPrompt,
    navigateToPrompt,
  };
}
