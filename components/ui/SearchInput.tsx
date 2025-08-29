"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SearchInput() {
  const router = useRouter();
  const [q, setQ] = React.useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form role="search" aria-label="Site" onSubmit={onSubmit} className="hidden sm:flex items-center gap-2">
      <label htmlFor="site-search" className="sr-only">Search</label>
      <input
        id="site-search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search prompts..."
        className="w-64 px-3 py-2 rounded-md bg-surface text-subtext placeholder:text-muted border border-border focus:outline-none focus:ring-2 focus:ring-accent-indigo"
        aria-label="Search prompts"
      />
      <button
        type="submit"
        className="px-3 py-2 rounded-md text-sm font-medium bg-accent-indigo text-white hover:opacity-90"
        aria-label="Submit search"
      >
        Search
      </button>
    </form>
  );
}
