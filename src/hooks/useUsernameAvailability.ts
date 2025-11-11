import { useEffect, useRef, useState } from 'react';

interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

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

export function useUsernameAvailability(username: string, jwtToken: string | null, originalUsername?: string) {
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameCheckResponse | null>(
    null
  );
  const usernameDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!username || !jwtToken) {
      setUsernameAvailability(null);
      return;
    }

    if (username === originalUsername) {
      setUsernameAvailability(null);
      return;
    }

    if (usernameDebounceRef.current) {
      window.clearTimeout(usernameDebounceRef.current);
      usernameDebounceRef.current = null;
    }

    usernameDebounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/check-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(jwtToken),
          },
          body: JSON.stringify({ username }),
        });

        const payload = (await response.json()) as UsernameCheckResponse & ApiErrorPayload;
        const available = response.ok ? payload.available : false;
        const message = payload.message ?? payload.reason ?? payload.error;
        setUsernameAvailability({ available, message });
      } catch (error) {
        console.error('Username availability check failed', error);
        setUsernameAvailability({ available: false, message: 'Unable to check username.' });
      }
    }, 300);

    return () => {
      if (usernameDebounceRef.current) {
        window.clearTimeout(usernameDebounceRef.current);
        usernameDebounceRef.current = null;
      }
    };
  }, [username, jwtToken, originalUsername]);

  return usernameAvailability;
}
