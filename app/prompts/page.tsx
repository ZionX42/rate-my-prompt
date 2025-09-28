import Link from 'next/link';
import { Metadata } from 'next';
import { searchPrompts, getCategoryStats } from '@/lib/repos/promptRepo';
import type { SearchResult } from '@/lib/repos/promptRepo';

export const metadata: Metadata = {
  title: 'Browse Prompts',
  description: 'Discover top-rated community prompts across categories and use cases.',
};

type PageSearchParams = {
  q?: string;
  category?: string;
  page?: string;
};

const PROMPTS_PER_PAGE = 12;

export default async function PromptsPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q.trim() : '';
  const categoryParam = typeof searchParams?.category === 'string' ? searchParams.category : 'all';
  const pageParam = parseInt(searchParams?.page ?? '1', 10);
  const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const filters = {
    q: query.length > 0 ? query : undefined,
    category: categoryParam !== 'all' ? categoryParam : undefined,
  };

  let prompts: SearchResult = [];
  let categories: Array<{ category: string; count: number }> = [];
  let fetchError: string | null = null;

  const envReady = Boolean(process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY);

  if (envReady) {
    try {
      const [searchResults, categoryStats] = await Promise.all([
        searchPrompts({
          ...filters,
          sort: 'newest',
          limit: PROMPTS_PER_PAGE,
          offset: (currentPage - 1) * PROMPTS_PER_PAGE,
        }),
        getCategoryStats(),
      ]);
      prompts = searchResults;
      categories = categoryStats;
    } catch (error) {
      console.error('Failed to load prompts:', error);
      fetchError = 'Unable to load prompts right now. Please try again later.';
    }
  } else {
    fetchError =
      'Prompt data is not available because Appwrite credentials are missing. Please configure the environment variables to enable browsing.';
  }

  const hasNextPage = prompts.length === PROMPTS_PER_PAGE;
  const hasPrevPage = currentPage > 1;

  const categoryOptions = ['all', ...Array.from(new Set(categories.map((item) => item.category)))];

  return (
    <main className="px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="space-y-6">
          <h1 className="heading-xl">Browse community prompts</h1>
          <p className="max-w-3xl text-lg text-subtext">
            Explore expert-crafted prompts, filter by category, and discover the tooling that powers
            the Prompt Hub community.
          </p>

          <PromptFilters
            query={query}
            category={categoryParam}
            categories={categoryOptions}
            isDisabled={!envReady}
          />
        </header>

        <section className="space-y-6">
          {fetchError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {fetchError}
            </div>
          ) : prompts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center text-subtext">
              <p>No prompts found for your filters just yet.</p>
              <p className="mt-2">
                Be the first to{' '}
                <Link href="/prompts/new" className="text-hfYellow underline">
                  submit a prompt
                </Link>
                .
              </p>
            </div>
          ) : (
            <PromptResultsGrid prompts={prompts} />
          )}
        </section>

        {prompts.length > 0 && (
          <PaginationControls
            query={query}
            category={categoryParam}
            currentPage={currentPage}
            hasPrev={hasPrevPage}
            hasNext={hasNextPage}
          />
        )}
      </div>
    </main>
  );
}

type PromptFiltersProps = {
  query: string;
  category: string;
  categories: string[];
  isDisabled: boolean;
};

function PromptFilters({ query, category, categories, isDisabled }: PromptFiltersProps) {
  return (
    <form
      method="get"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/80 p-6 shadow-sm md:flex-row md:items-end"
    >
      <label className="flex-1 text-sm text-subtext">
        Search
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Find prompts for marketing, coding, design..."
          className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
          disabled={isDisabled}
        />
      </label>
      <label className="w-full text-sm text-subtext md:w-56">
        Category
        <select
          name="category"
          defaultValue={category}
          className="mt-1 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm capitalize focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
          disabled={isDisabled}
        >
          {categories.map((option) => {
            const label =
              option === 'all'
                ? 'All categories'
                : option.replace(
                    /(^|[\s_-])(\w)/g,
                    (_, prefix: string, char: string) => `${prefix}${char.toUpperCase()}`
                  );
            return (
              <option key={option} value={option}>
                {label}
              </option>
            );
          })}
        </select>
      </label>
      <button
        type="submit"
        disabled={isDisabled}
        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Apply filters
      </button>
    </form>
  );
}

type PromptResultsGridProps = {
  prompts: SearchResult;
};

function PromptResultsGrid({ prompts }: PromptResultsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {prompts.map((prompt) => (
        <article
          key={prompt._id}
          className="card flex h-full flex-col border border-border bg-surface/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-accent-blue/70"
        >
          <header className="mb-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-heading line-clamp-2" title={prompt.title}>
                {prompt.title}
              </h2>
              {prompt.category && (
                <span className="flex-shrink-0 rounded-full bg-muted px-2 py-1 text-xs capitalize text-heading/80">
                  {prompt.category}
                </span>
              )}
            </div>
            <p className="text-sm text-subtext line-clamp-3">
              {prompt.description || prompt.content}
            </p>
          </header>

          <dl className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtext">
            <div className="flex items-center gap-1">
              <dt className="font-medium text-heading/80">Author:</dt>
              <dd>{prompt.authorId}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="font-medium text-heading/80">Created:</dt>
              <dd>{new Date(prompt.createdAt).toLocaleDateString('en-US')}</dd>
            </div>
            {typeof prompt.avgRating === 'number' && prompt.avgRating > 0 && (
              <div className="flex items-center gap-1">
                <dt className="font-medium text-heading/80">Rating:</dt>
                <dd>
                  {prompt.avgRating.toFixed(1)}
                  <span className="ml-1 text-[10px] text-subtext/80">
                    ({prompt.ratingCount ?? 0} reviews)
                  </span>
                </dd>
              </div>
            )}
          </dl>

          {prompt.tags && prompt.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {prompt.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2 py-1 text-xs text-subtext">
                  #{tag}
                </span>
              ))}
              {prompt.tags.length > 4 && (
                <span className="text-xs text-subtext">+{prompt.tags.length - 4} more</span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between">
            <Link
              href={`/prompts/${prompt._id}`}
              className="text-sm font-medium text-hfYellow underline underline-offset-4"
            >
              View prompt
            </Link>
            <span className="text-xs text-subtext">{prompt.content.length} chars</span>
          </div>
        </article>
      ))}
    </div>
  );
}

type PaginationControlsProps = {
  query: string;
  category: string;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
};

function PaginationControls({
  query,
  category,
  currentPage,
  hasPrev,
  hasNext,
}: PaginationControlsProps) {
  const buildSearch = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (page > 1) params.set('page', page.toString());
    return `?${params.toString()}`;
  };

  return (
    <nav className="flex items-center justify-between border-t border-border pt-6">
      <div>
        <span className="text-sm text-subtext">Page {currentPage}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={hasPrev ? buildSearch(currentPage - 1) : '#'}
          className={`rounded-lg border border-border px-3 py-2 text-sm transition ${hasPrev ? 'text-heading hover:bg-muted' : 'pointer-events-none text-subtext/60'}`}
          aria-disabled={!hasPrev}
        >
          Previous
        </Link>
        <Link
          href={hasNext ? buildSearch(currentPage + 1) : '#'}
          className={`rounded-lg border border-border px-3 py-2 text-sm transition ${hasNext ? 'text-heading hover:bg-muted' : 'pointer-events-none text-subtext/60'}`}
          aria-disabled={!hasNext}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
