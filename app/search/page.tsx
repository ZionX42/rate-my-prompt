'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

interface PromptSearchResult {
  _id: string;
  title: string;
  category?: string;
  authorId?: string;
  tags?: string[];
  score?: number;
  avgRating?: number;
  ratingCount?: number;
  description?: string;
}

interface SearchResponse {
  data: PromptSearchResult[];
  meta: {
    query?: string;
    total: number;
    limit: number;
    offset: number;
    sort: string;
    collection: string;
    timestamp: string;
  };
}

function parseParams(searchParams: Record<string, string | string[] | undefined>) {
  const q =
    typeof searchParams.q === 'string'
      ? searchParams.q
      : Array.isArray(searchParams.q)
        ? searchParams.q[0]
        : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const tags =
    typeof searchParams.tags === 'string'
      ? searchParams.tags.split(',').map((tag) => tag.trim())
      : undefined;
  const author = typeof searchParams.author === 'string' ? searchParams.author : undefined;
  const minRating =
    typeof searchParams.minRating === 'string' ? Number(searchParams.minRating) : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'relevance';
  const limit = typeof searchParams.limit === 'string' ? Number(searchParams.limit) : 20;
  const offset = typeof searchParams.offset === 'string' ? Number(searchParams.offset) : 0;
  const collection =
    typeof searchParams.collection === 'string' ? searchParams.collection : 'prompts';
  const dateFrom =
    typeof searchParams.dateFrom === 'string' ? new Date(searchParams.dateFrom) : undefined;
  const dateTo =
    typeof searchParams.dateTo === 'string' ? new Date(searchParams.dateTo) : undefined;

  return {
    q,
    category,
    tags,
    author,
    minRating: isNaN(minRating!) ? undefined : minRating,
    dateFrom: dateFrom && !isNaN(dateFrom.getTime()) ? dateFrom : undefined,
    dateTo: dateTo && !isNaN(dateTo.getTime()) ? dateTo : undefined,
    sort,
    limit: isNaN(limit) ? 20 : Math.min(Math.max(limit, 1), 100),
    offset: isNaN(offset) ? 0 : Math.max(offset, 0),
    collection,
  };
}

async function fetchSearchResults(params: Record<string, unknown>): Promise<SearchResponse> {
  const queryString = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        queryString.set(key, value.join(','));
      } else if (value instanceof Date) {
        queryString.set(key, value.toISOString().split('T')[0]);
      } else {
        queryString.set(key, String(value));
      }
    }
  });

  const response = await fetch(`/api/search?${queryString}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const params = parseParams(Object.fromEntries(searchParams.entries()));
        const searchResults = await fetchSearchResults(params);
        setResults(searchResults);
        setError(null);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [searchParams]);

  const params = parseParams(Object.fromEntries(searchParams.entries()));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-heading mb-4">Search Results</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  const searchResults = results?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-heading mb-4">Search Results</h1>

      {params.q ? (
        <p className="text-subtext mb-6">Showing results for &quot;{params.q}&quot;</p>
      ) : (
        <p className="text-subtext mb-6">Browse recent prompts</p>
      )}

      {/* Results count */}
      <div className="mb-6">
        <p className="text-subtext">
          {results?.meta.total || 0} results found
          {params.limit && ` (showing ${Math.min(params.limit, searchResults.length)})`}
        </p>
      </div>

      {/* Search results */}
      <div className="space-y-4">
        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-subtext text-lg">No results found</p>
            <p className="text-subtext mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          searchResults.map((result) => (
            <div
              key={result._id}
              className="bg-card border border-border rounded-lg p-6 shadow-soft hover:shadow-medium transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <Link
                  href={`/prompts/${result._id}`}
                  className="text-xl font-semibold text-heading hover:text-primary transition-colors"
                >
                  {result.title}
                </Link>
                {result.avgRating && (
                  <div className="flex items-center text-sm text-subtext">
                    <span className="mr-1">★</span>
                    {result.avgRating.toFixed(1)}
                    {result.ratingCount && <span className="ml-1">({result.ratingCount})</span>}
                  </div>
                )}
              </div>

              {result.description && (
                <p className="text-subtext mb-3 line-clamp-2">{result.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {result.category && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    {result.category}
                  </span>
                )}
                {result.tags &&
                  result.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                {result.tags && result.tags.length > 3 && (
                  <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                    +{result.tags.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-sm text-subtext">
                <span>By {result.authorId || 'Anonymous'}</span>
                {result.score && (
                  <span className="text-primary font-medium">Score: {result.score.toFixed(2)}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
