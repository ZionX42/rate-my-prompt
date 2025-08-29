import { searchPrompts, SearchParams } from '@/lib/repos/promptRepo';
import Link from 'next/link';
import Filters from '@/components/search/Filters';

function parseParams(searchParams: Record<string, string | string[] | undefined>): SearchParams {
  const q = typeof searchParams.q === 'string' ? searchParams.q : Array.isArray(searchParams.q) ? searchParams.q[0] : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const minRating = typeof searchParams.minRating === 'string' ? Number(searchParams.minRating) : undefined;
  const sort = typeof searchParams.sort === 'string' ? (searchParams.sort as any) : 'relevance';
  const dateFrom = typeof searchParams.dateFrom === 'string' ? new Date(searchParams.dateFrom) : undefined;
  const dateTo = typeof searchParams.dateTo === 'string' ? new Date(searchParams.dateTo) : undefined;

  return {
    q,
    category,
    minRating: isNaN(minRating as any) ? undefined : minRating,
    dateFrom: dateFrom && !isNaN(dateFrom.getTime()) ? dateFrom : undefined,
    dateTo: dateTo && !isNaN(dateTo.getTime()) ? dateTo : undefined,
    sort,
    limit: 50,
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const params = parseParams(searchParams);
  const results = await searchPrompts(params);

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
        {params.category && (<span>Category: <strong className="text-heading">{params.category}</strong></span>)}
        {typeof params.minRating === 'number' && (<span>Min rating: <strong className="text-heading">{params.minRating}⭐</strong></span>)}
        {params.dateFrom && (<span>From: <strong className="text-heading">{params.dateFrom.toISOString().slice(0,10)}</strong></span>)}
        {params.dateTo && (<span>To: <strong className="text-heading">{params.dateTo.toISOString().slice(0,10)}</strong></span>)}
      </div>

      {results.length === 0 && (
        <div className="text-subtext">No results found.</div>
      )}

      <ul className="divide-y divide-border rounded-md overflow-hidden bg-card shadow-soft">
        {results.map((p) => (
          <li key={String((p as any)._id)} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/prompts/${(p as any)._id}`} className="text-lg font-semibold text-heading hover:underline">
                  {p.title}
                </Link>
                {p.category && (
                  <div className="mt-1 text-xs text-subtext">Category: {p.category}</div>
                )}
                {p.tags && p.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {p.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-surface rounded-full text-subtext">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right text-sm text-subtext min-w-[120px]">
                {typeof (p as any).avgRating === 'number' ? (
                  <div>
                    <span className="text-heading font-medium">{(p as any).avgRating.toFixed(1)}</span> ⭐
                    <div className="text-xs">{(p as any).ratingCount || 0} ratings</div>
                  </div>
                ) : (
                  <div>No ratings</div>
                )}
              </div>
            </div>
            {p.description && (
              <p className="mt-2 text-subtext">{p.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
