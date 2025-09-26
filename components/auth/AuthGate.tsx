'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';

interface AuthGateProps {
  children: ReactNode;
  redirectTo?: string; // path to redirect if unauthenticated
  loadingFallback?: ReactNode;
}

export function AuthGate({
  children,
  redirectTo = '/login',
  loadingFallback = null,
}: AuthGateProps) {
  const { status } = useAppwriteAuth(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  if (status === 'loading' || status === 'idle') return <>{loadingFallback}</>;
  if (status !== 'authenticated') return null; // will redirect
  return <>{children}</>;
}
