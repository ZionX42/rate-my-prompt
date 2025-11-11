'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for managing CSRF tokens in client components
 */
export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch a new CSRF token from the server
   */
  const fetchToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/csrf/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('CSRF token fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get headers with CSRF token for API requests
   */
  const getHeaders = (additionalHeaders?: Record<string, string>) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  };

  /**
   * Make an authenticated request with CSRF token
   */
  const makeRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Ensure we have a token
    if (!csrfToken) {
      await fetchToken();
    }

    const headers = getHeaders(options.headers as Record<string, string>);

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  // Fetch token on mount
  useEffect(() => {
    fetchToken();
  }, []);

  return {
    csrfToken,
    loading,
    error,
    fetchToken,
    getHeaders,
    makeRequest,
  };
}
