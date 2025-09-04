import Link from 'next/link';
import dynamic from 'next/dynamic';

const Filters = dynamic(() => import('@/components/search/Filters'), {
  ssr: false,
  loading: () => <div className="mb-6 bg-card p-4 rounded-md shadow-soft">Loading filters...</div>,
});

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

  const response = await fetch(
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/search?${queryString}`,
    {
      cache: 'no-store', // Ensure fresh results
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseParams(resolvedSearchParams);

  let results: SearchResponse;
  try {
    results = await fetchSearchResults(params);
  } catch (error) {
    console.error('Search error:', error);
    results = {
      data: [],
      meta: {
        total: 0,
        limit: params.limit,
        offset: params.offset,
        sort: params.sort,
        collection: params.collection,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const searchResults = results.data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-heading mb-4">Search Results</h1>
      <Filters />
      {params.q ? (
        <p className="text-subtext mb-6">Showing results for &quot;{params.q}&quot;</p>
      ) : (
        <p className="text-subtext mb-6">Browse recent prompts</p>
      )}

      {/* Filters summary */}
      <div className="flex flex-wrap gap-3 text-sm text-subtext mb-6">
        {params.category && (
          <span>
            Category: <strong className="text-heading">{params.category}</strong>
          </span>
        )}
        {typeof params.minRating === 'number' && (
          <span>
            Min rating: <strong className="text-heading">{params.minRating}⭐</strong>
          </span>
        )}
        {params.dateFrom && (
          <span>
            From:{' '}
            <strong className="text-heading">{params.dateFrom.toISOString().slice(0, 10)}</strong>
          </span>
        )}
        {params.dateTo && (
          <span>
            To: <strong className="text-heading">{params.dateTo.toISOString().slice(0, 10)}</strong>
          </span>
        )}
      </div>

      {searchResults.length === 0 && (
        <div className="text-center py-12">
          <div className="text-subtext text-lg mb-2">No results found</div>
          <p className="text-muted">Try adjusting your search criteria or browse all prompts.</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <ul className="divide-y divide-border rounded-md overflow-hidden bg-card shadow-soft">
          {searchResults.map((p) => (
            <li key={p._id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/prompts/${p._id}`}
                    className="text-lg font-semibold text-heading hover:underline"
                  >
                    {p.title}
                  </Link>
                  {p.category && (
                    <div className="mt-1 text-xs text-subtext">Category: {p.category}</div>
                  )}
                  {p.authorId && (
                    <div className="mt-1 text-xs text-subtext">Author: {p.authorId}</div>
                  )}
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-surface rounded-full text-subtext"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.score && (
                    <div className="mt-1 text-xs text-accent-indigo">
                      Relevance: {p.score.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-subtext min-w-[120px]">
                  {typeof p.avgRating === 'number' ? (
                    <div>
                      <span className="text-heading font-medium">{p.avgRating.toFixed(1)}</span> ⭐
                      <div className="text-xs">{p.ratingCount || 0} ratings</div>
                    </div>
                  ) : (
                    <div>No ratings</div>
                  )}
                </div>
              </div>
              {p.description && <p className="mt-2 text-subtext">{p.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
