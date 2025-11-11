import { useState } from 'react';

interface ApiErrorPayload {
  error?: string;
  reason?: string;
  message?: string;
  status?: number;
}

function buildAuthHeaders(jwt: string) {
  return {
    Authorization: `Bearer ${jwt}`,
    'X-Appwrite-JWT': jwt,
  } as const;
}

export function useChangeEmail(jwtToken: string | null, onEmailChangeSuccess: (message: string) => void) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });

  const openEmailModal = (currentEmail: string) => {
    setEmailForm({
      newEmail: currentEmail,
      password: '',
    });
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!jwtToken) {
      onEmailChangeSuccess('Authentication expired. Please refresh the page.');
      return;
    }

    try {
      const response = await fetch('/api/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(jwtToken),
        },
        credentials: 'include',
        body: JSON.stringify(emailForm),
      });

      const payload = (await response.json()) as ApiErrorPayload & {
        ok?: boolean;
        message?: string;
        requiresVerification?: boolean;
      };

      if (!response.ok || !payload.ok) {
        const reason = payload.reason || payload.error || payload.message;
        throw new Error(reason || 'Email change failed');
      }

      const successMessage = payload.requiresVerification
          ? 'Verification email sent to the new address.'
          : 'Email updated successfully.';

      onEmailChangeSuccess(successMessage);
      setShowEmailModal(false);
    } catch (error) {
      console.error('Email change failed', error);
      onEmailChangeSuccess(error instanceof Error ? error.message : 'Failed to change email.');
    }
  };

  return {
      showEmailModal,
      setShowEmailModal,
      emailForm,
      setEmailForm,
      openEmailModal,
      handleEmailSubmit
  }
}
