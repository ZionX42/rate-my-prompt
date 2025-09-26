'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ui/ThemeToggle';
import SearchInput from './ui/SearchInput';
import { useAuthModal } from '@/components/auth/AuthModalProvider';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';
import UserMenu from '@/components/auth/UserMenu';

const NAV_LINKS = [
  { href: '/community', label: 'Community' },
  { href: '/academy', label: 'Academy' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/feedback', label: 'Feedback' },
];

const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { open } = useAuthModal();
  const { status, user } = useAppwriteAuth(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = status === 'authenticated' && Boolean(user);

  const activeHref = useMemo(() => pathname?.split('?')[0] ?? '/', [pathname]);

  const handleOpen = (mode: 'login' | 'signup') => {
    open(mode);
    setMobileOpen(false);
  };

  return (
    <nav className="bg-bg border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-heading">
                Prompt Hub
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = activeHref === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition ${
                      isActive
                        ? 'border-heading text-heading'
                        : 'border-transparent text-subtext hover:border-heading/40 hover:text-heading'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <SearchInput />
            <div className="ml-4 flex items-center gap-3">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpen('login')}
                    className="rounded-full px-3 py-2 text-sm font-medium text-subtext transition hover:text-heading"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpen('signup')}
                    className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 transition hover:brightness-110"
                  >
                    Sign up
                  </button>
                </>
              )}
              <ThemeToggle className="ml-2" />
            </div>
          </div>

          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex items-center justify-center rounded-md p-2 text-subtext hover:bg-card hover:text-heading focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-indigo"
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Toggle main menu</span>
              {mobileOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={`${mobileOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="space-y-1 px-4 pb-3 pt-2">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`block border-l-4 px-3 py-2 text-base font-medium transition ${
                activeHref === href
                  ? 'border-heading bg-surface text-heading'
                  : 'border-transparent text-subtext hover:border-heading/40 hover:bg-surface hover:text-heading'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="border-t border-border px-4 pb-3 pt-4">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-heading">
                  {user?.name ?? user?.email}
                </p>
                <p className="text-sm text-subtext">Signed in</p>
              </div>
              <button
                type="button"
                onClick={() => handleOpen('login')}
                className="ml-3 rounded-full border border-border px-3 py-2 text-sm text-subtext hover:text-heading"
              >
                Switch account
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpen('login')}
                className="w-full rounded-full px-4 py-2 text-base font-medium text-subtext hover:bg-card hover:text-heading"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => handleOpen('signup')}
                className="w-full rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-500 px-4 py-2 text-base font-semibold text-white shadow-lg"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
