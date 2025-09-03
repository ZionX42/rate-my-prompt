import {
  getCollections,
  PromptDoc,
  Query,
  RatingDoc,
  UserDoc,
  CommentDoc,
} from '../appwrite/collections';
import type { Models } from 'node-appwrite';
import {
  NewPromptInput,
  PromptModel,
  sanitizeNewPrompt,
  validateNewPrompt,
  PromptCategory,
} from '../models/prompt';

// Convert Appwrite document to PromptModel format
function convertToPromptModel(doc: PromptDoc): PromptModel {
  return {
    _id: doc.$id,
    title: doc.title,
    content: doc.content,
    authorId: doc.authorId,
    description: doc.description,
    category: doc.category as PromptCategory,
    tags: doc.tags || [],
    isPublished: doc.isPublished,
    createdAt: new Date(doc.$createdAt),
    updatedAt: new Date(doc.$updatedAt),
  };
}

// Convert PromptModel to Appwrite document format
function convertToPromptDoc(
  model: Omit<PromptModel, '_id'>
): Omit<PromptDoc, keyof Models.Document> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, ...rest } = model;
  return {
    ...rest,
    description: model.description || '',
    category: model.category || 'general',
    tags: model.tags || [],
    isPublished: model.isPublished || false,
  };
}

export async function createPrompt(input: NewPromptInput): Promise<PromptModel> {
  const validation = validateNewPrompt(input);
  if (!validation.ok) {
    const err = new Error('Invalid prompt input') as Error & { issues?: unknown };
    err.issues = validation.issues;
    throw err;
  }

  const { prompts } = await getCollections();
  const now = new Date();
  const model: Omit<PromptModel, '_id'> = {
    ...sanitizeNewPrompt(input),
    createdAt: now,
    updatedAt: now,
  };

  const promptDoc = convertToPromptDoc(model);
  const result = await prompts.create(promptDoc);
  return convertToPromptModel(result);
}

export async function getPromptById(id: string): Promise<PromptModel | null> {
  try {
    const { prompts } = await getCollections();
    const result = await prompts.get(id);
    return convertToPromptModel(result);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) return null;
    throw error;
  }
}

export async function listPromptsByAuthor(authorId: string, limit = 20): Promise<PromptModel[]> {
  const { prompts } = await getCollections();
  const queries = [
    Query.equal('authorId', authorId),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ];

  const result = await prompts.list(queries);
  return result.documents.map((doc) => convertToPromptModel(doc));
}

export async function getFeaturedPrompts(limit = 6): Promise<PromptModel[]> {
  const { prompts } = await getCollections();
  const queries = [
    Query.equal('isPublished', true),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ];

  const result = await prompts.list(queries);
  return result.documents.map((doc) => convertToPromptModel(doc));
}

export async function getPromptsByCategory(category: string, limit = 20): Promise<PromptModel[]> {
  const { prompts } = await getCollections();
  const queries = [
    Query.equal('isPublished', true),
    Query.equal('category', category),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ];

  const result = await prompts.list(queries);
  return result.documents.map((doc) => convertToPromptModel(doc));
}

export async function getCategoryStats(): Promise<Array<{ category: string; count: number }>> {
  // Note: Appwrite doesn't have aggregation pipelines like MongoDB
  // We need to implement this differently by fetching all published prompts
  // and grouping them in memory, or using a separate tracking collection
  const { prompts } = await getCollections();
  const queries = [
    Query.equal('isPublished', true),
    Query.limit(1000), // Adjust based on expected data size
  ];

  const result = await prompts.list(queries);
  const categoryCount: Record<string, number> = {};

  result.documents.forEach((doc) => {
    const promptDoc = doc as PromptDoc;
    const category = promptDoc.category || 'general';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  return Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export type SearchParams = {
  q?: string;
  category?: string;
  tags?: string[];
  author?: string;
  minRating?: number; // 1..5
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'newest' | 'rating' | 'popularity';
  collection?: 'prompts' | 'users' | 'comments' | 'all';
};

export type SearchResult = (PromptModel & {
  avgRating?: number;
  ratingCount?: number;
  score?: number;
})[];

export async function searchPrompts(params: SearchParams): Promise<SearchResult> {
  const {
    q,
    category,
    tags,
    author,
    minRating,
    dateFrom,
    dateTo,
    limit = 50,
    offset = 0,
    sort = 'relevance',
    collection: _collection = 'prompts',
  } = params;

  const { prompts, ratings } = await getCollections();
  const queries = [Query.equal('isPublished', true)];

  // Add category filter
  if (category && category !== 'all') {
    queries.push(Query.equal('category', category));
  }

  // Add author filter
  if (author) {
    queries.push(Query.equal('authorId', author));
  }

  // Add tags filter (if supported by Appwrite)
  if (tags && tags.length > 0) {
    // Note: Appwrite array queries might need different handling
    for (const tag of tags) {
      queries.push(Query.search('tags', tag));
    }
  }

  // Add date range filters
  if (dateFrom) {
    queries.push(Query.greaterThanEqual('createdAt', dateFrom.toISOString()));
  }
  if (dateTo) {
    queries.push(Query.lessThanEqual('createdAt', dateTo.toISOString()));
  }

  // Enhanced multi-field text search
  if (q && q.trim().length) {
    const searchTerm = q.trim();
    // Try searching across multiple fields
    // Note: Appwrite Query.search can only search one field at a time
    // We'll prioritize title, then fall back to description and content
    queries.push(Query.search('title', searchTerm));
  }

  // Add sorting
  switch (sort) {
    case 'newest':
      queries.push(Query.orderDesc('createdAt'));
      break;
    case 'rating':
      // For rating sort, we'll handle this after fetching results
      queries.push(Query.orderDesc('createdAt'));
      break;
    case 'popularity':
      // For popularity, we might need to add a computed field or handle post-query
      queries.push(Query.orderDesc('createdAt'));
      break;
    default:
      queries.push(Query.orderDesc('createdAt'));
  }

  // Add pagination
  if (offset > 0) {
    queries.push(Query.cursorAfter(offset.toString()));
  }
  queries.push(Query.limit(limit));

  const result = await prompts.list(queries);
  const promptModels = result.documents.map((doc) => convertToPromptModel(doc));
  const promptIds = promptModels.map((p) => p._id).filter((id): id is string => !!id);

  // Fetch all ratings for the returned prompts in a single query
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

  // For each prompt, fetch ratings and calculate averages
  const enrichedResults: SearchResult = [];

  for (const prompt of promptModels) {
    if (!prompt._id) continue; // Skip if no ID

    const ratingData = allRatings.get(prompt._id);
    const avgRating =
      ratingData && ratingData.count > 0 ? ratingData.total / ratingData.count : undefined;
    const ratingCount = ratingData ? ratingData.count : 0;

    // Apply minimum rating filter
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

  // Apply sorting for rating-based sorts
  if (sort === 'rating') {
    enrichedResults.sort((a, b) => {
      const aRating = a.avgRating || 0;
      const bRating = b.avgRating || 0;
      if (aRating !== bRating) return bRating - aRating;
      return (b.ratingCount || 0) - (a.ratingCount || 0);
    });
  }

  return enrichedResults;
}

// Helper function to calculate search relevance score
function calculateSearchScore(prompt: PromptModel, query: string): number {
  const searchTerm = query.toLowerCase();
  const title = prompt.title.toLowerCase();
  const description = prompt.description?.toLowerCase() || '';

  let score = 0;

  // Title matches get highest score
  if (title.includes(searchTerm)) {
    score += 10;
    if (title.startsWith(searchTerm)) score += 5; // Exact prefix match
  }

  // Description matches get medium score
  if (description.includes(searchTerm)) {
    score += 5;
  }

  // Tag matches get additional score
  if (prompt.tags) {
    prompt.tags.forEach((tag) => {
      if (tag.toLowerCase().includes(searchTerm)) {
        score += 3;
      }
    });
  }

  return score;
}

// Enhanced CRUD operations with better error handling
export async function getPromptsByTags(tags: string[], limit = 20): Promise<PromptModel[]> {
  const { prompts } = await getCollections();
  const queries = [Query.equal('isPublished', true)];

  // Add tag-based search
  if (tags.length > 0) {
    for (const tag of tags) {
      queries.push(Query.search('tags', tag));
    }
  }

  queries.push(Query.orderDesc('createdAt'));
  queries.push(Query.limit(limit));

  const result = await prompts.list(queries);
  return result.documents.map((doc) => convertToPromptModel(doc));
}

export async function getPromptsByAuthorWithStats(
  authorId: string,
  limit = 20
): Promise<PromptModel[]> {
  const { prompts } = await getCollections();
  const queries = [
    Query.equal('authorId', authorId),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ];

  const result = await prompts.list(queries);
  return result.documents.map((doc) => convertToPromptModel(doc));
}

// Cross-collection search functionality
export type CrossCollectionSearchResult = {
  prompts: SearchResult;
  users: UserDoc[]; // User search results
  comments: CommentDoc[]; // Comment search results
  totalCount: number;
};

export async function searchAllCollections(
  params: SearchParams
): Promise<CrossCollectionSearchResult> {
  const { q } = params;

  if (!q || !q.trim()) {
    return {
      prompts: [],
      users: [],
      comments: [],
      totalCount: 0,
    };
  }

  // Search prompts
  const promptResults = await searchPrompts({ ...params, collection: 'prompts' });

  // For now, return only prompt results
  // TODO: Implement user and comment search when those repositories are available
  return {
    prompts: promptResults,
    users: [],
    comments: [],
    totalCount: promptResults.length,
  };
}

// Enhanced pagination support
export async function getPromptsPaginated(params: {
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'relevance' | 'newest' | 'rating' | 'popularity';
}): Promise<{
  prompts: PromptModel[];
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  currentPage: number;
}> {
  const { page = 1, limit = 20, category, sort = 'newest' } = params;
  const offset = (page - 1) * limit;

  const searchParams: SearchParams = {
    category,
    sort,
    limit,
    offset,
  };

  const results = await searchPrompts(searchParams);

  return {
    prompts: results,
    totalCount: results.length, // This is approximate since Appwrite doesn't provide total counts easily
    hasNextPage: results.length === limit,
    hasPrevPage: page > 1,
    currentPage: page,
  };
}
