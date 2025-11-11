import { getCollections, Query, RatingDoc } from '../appwrite/collections';
import type { PromptModel } from '../models/prompt';
import type { SearchParams, SearchResult } from './promptRepo';

export function buildSearchQuery(params: SearchParams): string[] {
  const { category, tags, author, dateFrom, dateTo, sort = 'relevance' } = params;
  const queries = [Query.equal('isPublished', true)];

  if (category && category !== 'all') {
    queries.push(Query.equal('category', category));
  }

  if (author) {
    queries.push(Query.equal('authorId', author));
  }

  if (tags && tags.length > 0) {
    for (const tag of tags) {
      queries.push(Query.search('tags', tag));
    }
  }

  if (dateFrom) {
    queries.push(Query.greaterThanEqual('createdAt', dateFrom.toISOString()));
  }

  if (dateTo) {
    queries.push(Query.lessThanEqual('createdAt', dateTo.toISOString()));
  }

  switch (sort) {
    case 'newest':
      queries.push(Query.orderDesc('createdAt'));
      break;
    case 'rating':
      queries.push(Query.orderDesc('createdAt'));
      break;
    case 'popularity':
      queries.push(Query.orderDesc('createdAt'));
      break;
    default:
      queries.push(Query.orderDesc('createdAt'));
  }

  return queries;
}

export async function enrichPrompts(prompts: PromptModel[], q?: string, minRating?: number): Promise<SearchResult> {
  const { ratings } = await getCollections();
  const promptIds = prompts.map((p) => p._id).filter((id): id is string => !!id);

  const allRatings = new Map<string, { total: number; count: number }>();
  if (promptIds.length > 0) {
    const ratingQueries = [Query.equal('promptId', promptIds)];
    const ratingsResult = await ratings.list(ratingQueries);
    for (const r of ratingsResult.documents) {
      const ratingDoc = r as RatingDoc;
      const current = allRatings.get(ratingDoc.promptId) ?? { total: 0, count: 0 };
      current.total += ratingDoc.rating;
      current.count++;
      allRatings.set(ratingDoc.promptId, current);
    }
  }

  const enrichedResults: SearchResult = [];
  for (const prompt of prompts) {
    if (!prompt._id) continue;

    const ratingData = allRatings.get(prompt._id);
    const avgRating =
      ratingData && ratingData.count > 0 ? ratingData.total / ratingData.count : undefined;
    const ratingCount = ratingData ? ratingData.count : 0;

    if (typeof minRating === 'number' && avgRating !== undefined && avgRating < minRating) {
      continue;
    }

    enrichedResults.push({
      ...prompt,
      avgRating,
      ratingCount,
      score: q ? calculateSearchScore(prompt, q) : undefined,
    });
  }

  return enrichedResults;
}

function calculateSearchScore(prompt: PromptModel, query: string): number {
  const searchTerm = query.toLowerCase();
  const title = prompt.title.toLowerCase();
  const description = prompt.description?.toLowerCase() || '';
  const content = prompt.content.toLowerCase();

  let score = 0;

  if (title.includes(searchTerm)) {
    score += 10;
    if (title.startsWith(searchTerm)) score += 5;
  }

  if (description.includes(searchTerm)) {
    score += 7;
    if (description.startsWith(searchTerm)) score += 3;
  }

  if (content.includes(searchTerm)) {
    score += 3;
  }

  if (prompt.tags) {
    prompt.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(searchTerm)) {
        score += 5;
      }
    });
  }

  return score;
}
