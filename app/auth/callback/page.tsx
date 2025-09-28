'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { appwriteCreateJWT } from '@/lib/appwrite';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const nextPath = useMemo(() => {
    const raw = searchParams?.get('next');
    if (!raw) return '/';
    if (!raw.startsWith('/')) return '/';
    return raw;
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function syncAndRedirect() {
      try {
        setStatus('pending');
        const jwt = await appwriteCreateJWT();
        if (!jwt) {
          console.warn('OAuth Callback: Unable to obtain Appwrite JWT before sync request');
        }
        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
          },
          credentials: 'include',
        });

        if (!cancelled && response.ok) {
          console.log('Appwrite OAuth: Sync successful, redirecting to:', nextPath);
          setStatus('success');
          router.replace(nextPath);
          return;
        }

        const { reason } = await response.json().catch(() => ({ reason: 'unknown' }));
        throw new Error(typeof reason === 'string' ? reason : 'sync-failed');
      } catch (error) {
        if (!cancelled) {
          console.error('OAuth sync failed', error);
          setStatus('error');
          router.replace('/login?error=oauth-sync');
        }
      }
    }

    void syncAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-4 text-center text-neutral-100">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Finishing up your sign-in…</h1>
        <p className="text-sm text-neutral-400">
          {status === 'error'
            ? 'We hit a snag syncing your profile. Redirecting you back to the login page to try again.'
            : 'Hang tight while we sync your profile and take you to your destination.'}
        </p>
      </div>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
    </div>
  );
}
