'use client';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function useFilterState() {
  const searchParams = useSearchParams();
  const [q, setQ] = React.useState(searchParams.get('q') ?? '');
  const [category, setCategory] = React.useState(searchParams.get('category') ?? 'all');
  const [tags, setTags] = React.useState(searchParams.get('tags') ?? '');
  const [author, setAuthor] = React.useState(searchParams.get('author') ?? '');
  const [collection, setCollection] = React.useState(searchParams.get('collection') ?? 'prompts');
  const [minRating, setMinRating] = React.useState<number | ''>(() => {
    const m = searchParams.get('minRating');
    const n = m ? Number(m) : NaN;
    return isNaN(n) ? '' : n;
  });
  const [dateFrom, setDateFrom] = React.useState(searchParams.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = React.useState(searchParams.get('dateTo') ?? '');
  const [sort, setSort] = React.useState(searchParams.get('sort') ?? 'relevance');
  const [limit, setLimit] = React.useState<number>(() => {
    const l = searchParams.get('limit');
    const n = l ? Number(l) : 20;
    return isNaN(n) ? 20 : Math.min(Math.max(n, 1), 100);
  });

  return {
    q,
    setQ,
    category,
    setCategory,
    tags,
    setTags,
    author,
    setAuthor,
    collection,
    setCollection,
    minRating,
    setMinRating,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sort,
    setSort,
    limit,
    setLimit,
  };
}

export default function Filters() {
  const router = useRouter();
  const state = useFilterState();

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (state.q.trim()) params.set('q', state.q.trim());
    if (state.category && state.category !== 'all') params.set('category', state.category);
    if (state.tags.trim()) params.set('tags', state.tags.trim());
    if (state.author.trim()) params.set('author', state.author.trim());
    if (state.collection && state.collection !== 'prompts')
      params.set('collection', state.collection);
    if (typeof state.minRating === 'number') params.set('minRating', String(state.minRating));
    if (state.dateFrom) params.set('dateFrom', state.dateFrom);
    if (state.dateTo) params.set('dateTo', state.dateTo);
    if (state.sort && state.sort !== 'relevance') params.set('sort', state.sort);
    if (state.limit !== 20) params.set('limit', String(state.limit));
    router.push(`/search?${params.toString()}`);
  }

  function clearAll() {
    router.push('/search');
  }

  return (
    <form onSubmit={applyFilters} className="mb-6 bg-card p-4 rounded-md shadow-soft">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Query</label>
          <input
            value={state.q}
            onChange={(e) => state.setQ(e.target.value)}
            placeholder="Search prompts, descriptions, tags..."
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
            <option value="all">All Categories</option>
            <option value="writing">Writing</option>
            <option value="coding">Coding</option>
            <option value="design">Design</option>
            <option value="research">Research</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Tags</label>
          <input
            value={state.tags}
            onChange={(e) => state.setTags(e.target.value)}
            placeholder="e.g., ai, chatgpt, python"
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading placeholder:text-muted"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Author</label>
          <input
            value={state.author}
            onChange={(e) => state.setAuthor(e.target.value)}
            placeholder="Author username"
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading placeholder:text-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end mt-4">
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Collection</label>
          <select
            value={state.collection}
            onChange={(e) => state.setCollection(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading"
          >
            <option value="prompts">Prompts</option>
            <option value="users">Users</option>
            <option value="comments">Comments</option>
            <option value="all">All</option>
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
            <option value="4">4+ ⭐</option>
            <option value="3">3+ ⭐</option>
            <option value="2">2+ ⭐</option>
            <option value="1">1+ ⭐</option>
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
        <div>
          <label className="block text-sm font-medium text-subtext mb-1">Results per page</label>
          <select
            value={state.limit}
            onChange={(e) => state.setLimit(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-surface border border-border text-heading"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-3 items-center">
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-accent-indigo text-white hover:bg-accent-indigo/90"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-4 py-2 rounded-md border border-border text-heading hover:bg-surface"
        >
          Clear All
        </button>
        <div className="ml-auto flex items-center gap-3">
          <label className="text-sm text-subtext">Sort by:</label>
          <select
            value={state.sort}
            onChange={(e) => state.setSort(e.target.value)}
            className="px-3 py-2 rounded-md bg-surface border border-border text-heading"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>
    </form>
  );
}
