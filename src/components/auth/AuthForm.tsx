'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { OAuthProvider } from 'appwrite';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';
import { getAppwriteAccount } from '@/lib/appwriteAccount';
import type { AuthModalMode } from '@/components/auth/AuthModalProvider';
import { useSearchParams } from 'next/navigation';

type OAuthProviderId = 'github' | 'google' | 'azure' | 'discord';

interface AuthFormProps {
  mode?: AuthModalMode;
  onSuccess?: (mode: AuthModalMode) => void;
  onModeChange?: (mode: AuthModalMode) => void;
  inModal?: boolean;
}

interface OAuthProviderConfig {
  id: OAuthProviderId;
  label: string;
  help?: string;
  icon: React.ReactNode;
}

const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: 'github',
    label: 'Continue with GitHub',
    help: 'Currently disabled',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    id: 'discord',
    label: 'Continue with Discord',
    help: 'Currently disabled',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.191.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    id: 'azure',
    label: 'Continue with Microsoft',
    help: 'Currently disabled',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
      </svg>
    ),
  },
];

const ACTIVE_OAUTH_PROVIDERS = new Set<OAuthProviderId>(['google']);

export default function AuthForm({
  mode: initialMode = 'login',
  onSuccess,
  onModeChange,
  inModal,
}: AuthFormProps) {
  const { status, error, clearError, signup, login, ready, missingEnv } = useAppwriteAuth(true);
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [oauthInFlight, setOauthInFlight] = useState<OAuthProviderId | null>(null);
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const raw = searchParams?.get('next');
    if (!raw) return '/';
    if (!raw.startsWith('/')) return '/';
    return raw;
  }, [searchParams]);

  const loading = status === 'loading';
  const disableOAuth = loading || !ready;
  const missingConfig = useMemo(() => missingEnv.join(', '), [missingEnv]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    onModeChange?.(mode);
    clearError();
    setFeedback(null);
    setLocalError(null);
  }, [mode, onModeChange, clearError]);

  const updateMode = useCallback(
    (nextMode: AuthModalMode) => {
      setMode(nextMode);
      onModeChange?.(nextMode);
    },
    [onModeChange]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFeedback(null);
      setLocalError(null);

      if (!ready) {
        setLocalError('Authentication is not configured. Missing env vars.');
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      const sanitizedPassword = password.trim();

      if (sanitizedPassword.length < 8) {
        setLocalError('Password must be at least 8 characters.');
        return;
      }

      try {
        if (mode === 'signup') {
          await signup(trimmedEmail, sanitizedPassword, trimmedName || undefined);
          setFeedback('Account created! You can now log in.');
          onSuccess?.('signup');
          updateMode('login');
          return;
        }

        await login(trimmedEmail, sanitizedPassword);
        console.log('AuthForm: Login successful, calling onSuccess with login mode');
        setFeedback('Logged in successfully. Redirecting...');
        onSuccess?.('login');
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Something went wrong');
        if (mode === 'login') {
          setPassword('');
        }
      }
    },
    [ready, email, password, name, mode, signup, login, onSuccess, updateMode]
  );

  const triggerOAuth = useCallback(
    async (provider: OAuthProviderId) => {
      if (!ready) {
        setLocalError('Authentication is not configured. Missing env vars.');
        return;
      }
      setOauthInFlight(provider);
      setLocalError(null);
      try {
        const account = getAppwriteAccount();
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        if (!origin) {
          throw new Error('Unable to determine site origin for OAuth redirect');
        }

        const successUrl = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const failureUrl = `${origin}/login?error=oauth`;

        await account.createOAuth2Session(provider as OAuthProvider, successUrl, failureUrl);
      } catch (err) {
        setOauthInFlight(null);
        setLocalError(err instanceof Error ? err.message : `OAuth with ${provider} failed`);
      }
    },
    [ready, nextPath]
  );

  return (
    <div
      className={clsx(
        'w-full',
        inModal
          ? 'px-6 py-8 sm:px-10'
          : 'max-w-md mx-auto p-6 border rounded-2xl shadow-sm bg-white dark:bg-neutral-900'
      )}
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {mode === 'signup'
            ? 'Sign up with email or continue with a provider.'
            : 'Use your email and password or continue with a provider.'}
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {OAUTH_PROVIDERS.filter(({ id }) => ACTIVE_OAUTH_PROVIDERS.has(id)).map(
          ({ id, label, help, icon }) => {
            const buttonDisabled = disableOAuth || oauthInFlight === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => triggerOAuth(id)}
                disabled={buttonDisabled}
                className="flex items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              >
                <span className="flex-shrink-0">{icon}</span>
                <span className="flex-1">{oauthInFlight === id ? 'Redirecting…' : label}</span>
                {help ? <span className="sr-only">{help}</span> : null}
              </button>
            );
          }
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" aria-hidden />
        <span className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" aria-hidden />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        {mode === 'signup' && (
          <label className="grid gap-1 text-left text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ada Lovelace"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
              required
            />
          </label>
        )}

        <label className="grid gap-1 text-left text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-200">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            required
          />
        </label>

        <label className="grid gap-1 text-left text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-200">Password</span>
          <input
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter at least 8 characters"
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            minLength={8}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <span>{mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}</span>
        <button
          type="button"
          onClick={() => updateMode(mode === 'signup' ? 'login' : 'signup')}
          className="font-medium text-neutral-900 underline-offset-4 transition hover:underline dark:text-neutral-100"
        >
          {mode === 'signup' ? 'Log in' : 'Sign up'}
        </button>
      </div>

      {!ready && (
        <p className="mt-6 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/70 dark:bg-amber-500/10 dark:text-amber-200">
          Authentication isn’t fully configured yet. Missing environment variables: {missingConfig}.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-600/70 dark:bg-red-500/5 dark:text-red-200">
          {error}
        </p>
      )}

      {localError && !error && (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-600/70 dark:bg-red-500/5 dark:text-red-200">
          {localError}
        </p>
      )}

      {feedback && (
        <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200">
          {feedback}
        </p>
      )}
    </div>
  );
}
