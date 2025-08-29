import { NextRequest } from 'next/server';
import { searchPrompts } from '@/lib/repos/promptRepo';
import { ok, badRequest, serviceUnavailable, internalError } from '@/lib/api/responses';
import { simpleRateLimit } from '@/lib/api/middleware';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) return serviceUnavailable('Storage not configured');

    const rate = simpleRateLimit(req, 120, 60_000);
    if (rate) return rate;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const minRating = searchParams.get('minRating');
    const sort = (searchParams.get('sort') as 'relevance' | 'newest' | 'rating') || 'relevance';
    const dateFromStr = searchParams.get('dateFrom');
    const dateToStr = searchParams.get('dateTo');

    const dateFrom = dateFromStr ? new Date(dateFromStr) : undefined;
    const dateTo = dateToStr ? new Date(dateToStr) : undefined;
    const minRatingNum = minRating ? Number(minRating) : undefined;
    if (minRating && Number.isNaN(minRatingNum)) return badRequest('minRating must be a number');

    const results = await searchPrompts({ q, category, minRating: minRatingNum, dateFrom, dateTo, sort, limit: 50 });
    return ok(results);
  } catch (err) {
    return internalError(err);
  }
}
