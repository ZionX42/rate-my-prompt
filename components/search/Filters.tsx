"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function useFilterState() {
  const searchParams = useSearchParams();
  const [q, setQ] = React.useState(searchParams.get('q') ?? '');
  const [category, setCategory] = React.useState(searchParams.get('category') ?? 'all');
  const [minRating, setMinRating] = React.useState<number | ''>(() => {
    const m = searchParams.get('minRating');
    const n = m ? Number(m) : NaN;
    return isNaN(n) ? '' : n;
  });
  const [dateFrom, setDateFrom] = React.useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = React.useState(searchParams.get('dateTo') ?? '');
  const [sort, setSort] = React.useState(searchParams.get('sort') ?? 'relevance');

  return { q, setQ, category, setCategory, minRating, setMinRating, dateFrom, setDateFrom, dateTo, setDateTo, sort, setSort };
}

export default function Filters() {
  const router = useRouter();
  const state = useFilterState();

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (state.q.trim()) params.set('q', state.q.trim());
    if (state.category && state.category !== 'all') params.set('category', state.category);
    if (typeof state.minRating === 'number') params.set('minRating', String(state.minRating));
    if (state.dateFrom) params.set('dateFrom', state.dateFrom);
    if (state.dateTo) params.set('dateTo', state.dateTo);
    if (state.sort) params.set('sort', state.sort);
    router.push(`/search?${params.toString()}`);
  }

  function clearAll() {
    router.push('/search');
  }

  return (
    <form onSubmit={applyFilters} className="mb-6 bg-card p-4 rounded-md shadow-soft">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Query</label>
          <input
            value={state.q}
            onChange={(e) => state.setQ(e.target.value)}
            placeholder="Search prompts"
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading placeholder:text-muted"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Category</label>
          <select
            value={state.category}
            onChange={(e) => state.setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading"
          >
            <option value="all">All</option>
            <option value="writing">Writing</option>
            <option value="coding">Coding</option>
            <option value="design">Design</option>
            <option value="research">Research</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Min rating</label>
          <select
            value={state.minRating === '' ? '' : String(state.minRating)}
            onChange={(e) => state.setMinRating(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading"
          >
            <option value="">Any</option>
            <option value="4">4+</option>
            <option value="3">3+</option>
            <option value="2">2+</option>
            <option value="1">1+</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Date from</label>
          <input
            type="date"
            value={state.dateFrom}
            onChange={(e) => state.setDateFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Date to</label>
          <input
            type="date"
            value={state.dateTo}
            onChange={(e) => state.setDateTo(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button type="submit" className="px-4 py-2 rounded-md bg-accent-indigo text-white">Apply</button>
        <button type="button" onClick={clearAll} className="px-4 py-2 rounded-md border border-border text-heading">Clear</button>
        <div className="ml-auto">
          <label className="mr-2 text-sm text-subtext">Sort</label>
          <select
            value={state.sort}
            onChange={(e) => state.setSort(e.target.value)}
            className="px-3 py-2 rounded-md bg-surface border border-border text-heading"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>
    </form>
  );
}
