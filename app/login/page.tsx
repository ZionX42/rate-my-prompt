'use client';

import { useEffect } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export default function LoginPage() {
  const { open } = useAuthModal();

  useEffect(() => {
    open('login');
  }, [open]);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Log in to Prompt Hub
        </h1>
        <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400">
          The authentication modal should appear automatically. If it does not, use the form below.
        </p>
      </header>
      <div className="w-full rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <AuthForm mode="login" />
      </div>
    </section>
  );
}
