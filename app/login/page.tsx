'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export default function LoginPage() {
  const { open } = useAuthModal();
  const searchParams = useSearchParams();
  const showInlineForm = searchParams.get('form') === '1';

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
      {showInlineForm ? (
        <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <AuthForm mode="login" />
        </div>
      ) : (
        <div className="w-full max-w-xl rounded-xl border border-dashed border-neutral-300 bg-white/40 px-6 py-5 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
          <p className="text-center">
            The modal is the primary way to sign in. If you need the classic form,{' '}
            <Link href="?form=1" className="font-medium text-blue-600 underline dark:text-blue-400">
              open the fallback form
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={() => open('login')}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
          >
            Re-open login modal
          </button>
        </div>
      )}
    </section>
  );
}
