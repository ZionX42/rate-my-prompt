'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Models } from 'appwrite';
import { missingAppwriteEnvVars, appwriteCreateJWT } from '@/lib/appwrite';
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
    console.log('Appwrite Auth: Syncing user profile');
    const jwt = await appwriteCreateJWT();
    if (!jwt) {
      console.warn('Appwrite Auth: Failed to obtain Appwrite JWT before sync request');
    }
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('Appwrite Auth: Profile sync failed with status:', response.status);
      return;
    }

    console.log('Appwrite Auth: Profile sync completed');
  } catch (error) {
    console.warn('Appwrite Auth: User profile sync failed', error);
  }
}

function normaliseErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = Number((error as { code?: number }).code);
    if (Number.isFinite(code) && code === 401) {
      return 'Invalid email or password. Please double-check your credentials and try again.';
    }
  }

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
        setUser(null);
        setStatus('unauthenticated');
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [ensureReady, loadUser]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      console.log('useAppwriteAuth: Starting login process for', email);
      ensureReady();
      setStatus('loading');
      setError(null);
      try {
        const account = getAppwriteAccount();
        console.log('useAppwriteAuth: Creating email password session');
        await account.createEmailPasswordSession({ email, password });
        console.log('useAppwriteAuth: Session created, waiting for cookie to be set');

        // Wait for session cookie to be set
        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log('useAppwriteAuth: Syncing profile');
        await syncProfile();
        console.log('useAppwriteAuth: Profile synced, loading user');
        await loadUser();
        console.log('useAppwriteAuth: Login process completed successfully');
      } catch (err) {
        const message = normaliseErrorMessage(err, 'Login failed');
        console.error('useAppwriteAuth: Login failed:', message);
        setUser(null);
        setStatus('unauthenticated');
        setError(message);
        throw err instanceof Error ? err : new Error(message);
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
