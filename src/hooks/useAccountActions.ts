import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ApiErrorPayload {
  error?: string;
  reason?: string;
  message?: string;
  status?: number;
}

type AccountAction = 'disable' | 'anonymize' | 'delete';

function buildAuthHeaders(jwt: string) {
  return {
    Authorization: `Bearer ${jwt}`,
    'X-Appwrite-JWT': jwt,
  } as const;
}

export function useAccountActions(jwtToken: string | null, onActionSuccess: (message: string) => void) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accountAction, setAccountAction] = useState<AccountAction | null>(null);
  const [accountConfirm, setAccountConfirm] = useState(false);
  const [disableTargetState, setDisableTargetState] = useState(false);

  const loginRedirect = () => {
    const nextParam = searchParams?.get('next') ?? '/profile';
    router.replace(`/login?next=${encodeURIComponent(nextParam)}`);
  };

  const handleAccountAction = async () => {
    if (!accountAction || !accountConfirm || !jwtToken) {
      return;
    }

    try {
      let response: Response;

      if (accountAction === 'disable') {
        response = await fetch('/api/disable-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(jwtToken),
          },
          credentials: 'include',
          body: JSON.stringify({ disabled: disableTargetState }),
        });
      } else {
        response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(jwtToken),
          },
          credentials: 'include',
          body: JSON.stringify({
            mode: accountAction,
            confirmation: true,
          }),
        });
      }

      if (response.status === 401 || response.status === 403) {
        loginRedirect();
        return;
      }

      const payload = (await response.json()) as ApiErrorPayload & { disabled?: boolean };
      if (!response.ok) {
        const reason = payload.reason || payload.error || payload.message;
        throw new Error(reason || 'Account action failed');
      }

      const successMessage = accountAction === 'disable'
          ? disableTargetState
            ? 'Account disabled. Contact support to re-enable.'
            : 'Account re-enabled.'
          : accountAction === 'anonymize'
            ? 'Account anonymized. Some features may no longer be available.'
            : 'Account scheduled for deletion. You will be signed out shortly.'

      onActionSuccess(successMessage);
      setAccountAction(null);
      setAccountConfirm(false);

    } catch (error) {
      console.error('Account action failed', error);
      onActionSuccess(error instanceof Error ? error.message : 'Failed to process account action.');
    }
  };

  return {
    accountAction,
    setAccountAction,
    accountConfirm,
    setAccountConfirm,
    disableTargetState,
    setDisableTargetState,
    handleAccountAction,
  };
}
