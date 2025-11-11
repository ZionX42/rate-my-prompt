'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';

function getInitials(name?: string | null) {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function UserMenu() {
  const { user, logout, status } = useAppwriteAuth(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      window.addEventListener('mousedown', handleClick);
      return () => window.removeEventListener('mousedown', handleClick);
    }
    return undefined;
  }, [open]);

  if (status !== 'authenticated' || !user) {
    return null;
  }

  const initials = getInitials(user.name ?? user.email);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 dark:bg-neutral-100 dark:text-neutral-900"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials || 'U'}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {user.name || user.email}
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
          </div>
          <nav className="grid">
            <Link
              href="/profile"
              onClick={close}
              className="px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Profile
            </Link>
            <Link
              href="/admin"
              onClick={close}
              className="px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                close();
              }}
              className="px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              Sign out
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
