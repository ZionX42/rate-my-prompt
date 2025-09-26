'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Models } from 'appwrite';
import { missingAppwriteEnvVars } from '@/lib/appwrite';
import { getAppwriteAccount } from '@/lib/appwriteAccount';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface UseAppwriteAuthResponse {
  status: AuthStatus;
  user: Models.User<Models.Preferences> | null;
  error: string | null;
  ready: boolean;
  missingEnv: string[];
  signup(email: string, password: string, name?: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  clearError(): void;
}

const SYNC_ENDPOINT = '/api/auth/sync';

async function syncProfile() {
  try {
    await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (error) {
    console.warn('User profile sync failed', error);
  }
}

function normaliseErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

export function useAppwriteAuth(auto = true): UseAppwriteAuthResponse {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingEnv, setMissingEnv] = useState<string[]>(() => missingAppwriteEnvVars());

  const ready = useMemo(() => missingEnv.length === 0, [missingEnv]);

  const checkEnv = useCallback(() => {
    setMissingEnv(missingAppwriteEnvVars());
  }, []);

  const loadUser = useCallback(async () => {
    if (!ready) {
      setStatus('error');
      setError('Auth not configured');
      return null;
    }

    setStatus('loading');
    setError(null);

    try {
      const account = getAppwriteAccount();
      const current = await account.get();
      setUser(current);
      setStatus('authenticated');
      return current;
    } catch (err) {
      setUser(null);
      setStatus('unauthenticated');
      if (err instanceof Error && err.message.includes('missing scope')) {
        setError('Session expired. Please log in again.');
      }
      return null;
    }
  }, [ready]);

  useEffect(() => {
    checkEnv();
  }, [checkEnv]);

  useEffect(() => {
    if (!auto) return;
    if (!ready) {
      setStatus('error');
      setError('Auth not configured');
      return;
    }
    void loadUser();
  }, [auto, ready, loadUser]);

  const ensureReady = useCallback(() => {
    const currentMissing = missingAppwriteEnvVars();
    setMissingEnv(currentMissing);
    if (currentMissing.length > 0) {
      const message = `Missing Appwrite config: ${currentMissing.join(', ')}`;
      setStatus('error');
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      ensureReady();
      setStatus('loading');
      setError(null);
      try {
        const account = getAppwriteAccount();
        await account.create({ userId: 'unique()', email, password, name });
        await account.createEmailPasswordSession({ email, password });
        await syncProfile();
        await loadUser();
      } catch (err) {
        const message = normaliseErrorMessage(err, 'Sign up failed');
        setStatus('error');
        setError(message);
        throw err;
      }
    },
    [ensureReady, loadUser]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      ensureReady();
      setStatus('loading');
      setError(null);
      try {
        const account = getAppwriteAccount();
        await account.createEmailPasswordSession({ email, password });
        await syncProfile();
        await loadUser();
      } catch (err) {
        const message = normaliseErrorMessage(err, 'Login failed');
        setStatus('error');
        setError(message);
        throw err;
      }
    },
    [ensureReady, loadUser]
  );

  const logout = useCallback(async () => {
    try {
      ensureReady();
    } catch {
      // If config missing we still want to reset client-side state
    }

    setStatus('loading');
    setError(null);

    try {
      const account = getAppwriteAccount();
      await account.deleteSession('current');
    } catch (err) {
      console.warn('Logout session delete failed', err);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, [ensureReady]);

  const refresh = useCallback(async () => {
    checkEnv();
    await loadUser();
  }, [checkEnv, loadUser]);

  const clearError = useCallback(() => setError(null), []);

  return {
    status,
    user,
    error,
    ready,
    missingEnv,
    signup,
    login,
    logout,
    refresh,
    clearError,
  };
}
