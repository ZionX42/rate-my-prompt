import { NextRequest } from 'next/server';
import {
  searchPrompts,
  searchAllCollections,
  getPromptsPaginated,
  SearchParams,
} from '@/lib/repos/promptRepo';
import { ok, badRequest, serviceUnavailable, internalError } from '@/lib/api/responses';
import { simpleRateLimit } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      return serviceUnavailable('Storage not configured');
    }

    const rate = simpleRateLimit(req, 120, 60_000);
    if (rate) return rate;

    const { searchParams } = new URL(req.url);

    // Parse query parameters with enhanced validation
    const q = searchParams.get('q')?.trim() || undefined;
    const category = searchParams.get('category')?.trim() || undefined;
    const tags =
      searchParams
        .get('tags')
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) || undefined;
    const author = searchParams.get('author')?.trim() || undefined;
    const collection =
      (searchParams.get('collection') as 'prompts' | 'users' | 'comments' | 'all') || 'prompts';

    // Parse numeric parameters
    const minRatingStr = searchParams.get('minRating');
    const minRating = minRatingStr ? Number(minRatingStr) : undefined;
    if (minRatingStr && Number.isNaN(minRating)) {
      return badRequest('minRating must be a number');
    }

    const limitStr = searchParams.get('limit');
    const limit = limitStr ? Number(limitStr) : 20;
    if (limitStr && (Number.isNaN(limit) || limit < 1 || limit > 100)) {
      return badRequest('limit must be a number between 1 and 100');
    }

    const offsetStr = searchParams.get('offset');
    const offset = offsetStr ? Number(offsetStr) : 0;
    if (offsetStr && (Number.isNaN(offset) || offset < 0)) {
      return badRequest('offset must be a non-negative number');
    }

    const pageStr = searchParams.get('page');
    const page = pageStr ? Number(pageStr) : undefined;
    if (pageStr && (Number.isNaN(page!) || page! < 1)) {
      return badRequest('page must be a positive number');
    }

    // Parse date parameters
    const dateFromStr = searchParams.get('dateFrom');
    const dateToStr = searchParams.get('dateTo');
    const dateFrom = dateFromStr ? new Date(dateFromStr) : undefined;
    const dateTo = dateToStr ? new Date(dateToStr) : undefined;

    if (dateFromStr && (!dateFrom || isNaN(dateFrom.getTime()))) {
      return badRequest('dateFrom must be a valid date');
    }
    if (dateToStr && (!dateTo || isNaN(dateTo.getTime()))) {
      return badRequest('dateTo must be a valid date');
    }

    // Parse sort parameter
    const sort =
      (searchParams.get('sort') as 'relevance' | 'newest' | 'rating' | 'popularity') || 'relevance';

    // Build search parameters
    const searchParamsObj: SearchParams = {
      q,
      category,
      tags,
      author,
      minRating,
      dateFrom,
      dateTo,
      limit,
      offset,
      sort,
      collection,
    };

    let results;

    // Handle different search types
    if (collection === 'all') {
      // Cross-collection search
      results = await searchAllCollections(searchParamsObj);
    } else if (page) {
      // Paginated search
      results = await getPromptsPaginated({
        page,
        limit,
        category,
        sort,
      });
    } else {
      // Standard search
      results = await searchPrompts(searchParamsObj);
    }

    // Add metadata to response
    const response = {
      data: results,
      meta: {
        query: q,
        total: Array.isArray(results) ? results.length : results.totalCount || 0,
        limit,
        offset,
        sort,
        collection,
        timestamp: new Date().toISOString(),
      },
    };

    return ok(response);
  } catch (err) {
    console.error('Search API error:', err);
    return internalError(err);
  }
}
