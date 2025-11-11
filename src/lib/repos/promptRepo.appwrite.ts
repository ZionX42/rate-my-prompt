import { getCollections, PromptDoc, Query } from '../appwrite/collections';
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
): Omit<PromptDoc, '$id' | '$collectionId' | '$databaseId' | '$permissions' | '$sequence'> {
  return {
    title: model.title,
    content: model.content,
    authorId: model.authorId,
    description: model.description || '',
    category: model.category || 'general',
    tags: model.tags || [],
    isPublished: model.isPublished || false,
    $createdAt: model.createdAt.toISOString(),
    $updatedAt: model.updatedAt.toISOString(),
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
  const doc: Omit<PromptModel, '_id'> = {
    ...sanitizeNewPrompt(input),
    createdAt: now,
    updatedAt: now,
  };

  const promptDoc = convertToPromptDoc(doc);
  const result = await prompts.create(promptDoc);
  return convertToPromptModel(result);
}

export async function getPromptById(id: string): Promise<PromptModel | null> {
  try {
    const { prompts } = await getCollections();
    const result = await prompts.get(id);
    return convertToPromptModel(result);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: unknown }).code === 404
    )
      return null;
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
  minRating?: number; // 1..5
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  sort?: 'relevance' | 'newest' | 'rating';
};

export type SearchResult = (PromptModel & {
  avgRating?: number;
  ratingCount?: number;
  score?: number;
})[];

export async function searchPrompts(params: SearchParams): Promise<SearchResult> {
  const { q, category, minRating, dateFrom, dateTo, limit = 50, sort = 'relevance' } = params;

  const { prompts, ratings } = await getCollections();
  const queries = [Query.equal('isPublished', true)];

  // Add category filter
  if (category && category !== 'all') {
    queries.push(Query.equal('category', category));
  }

  // Add date range filters
  if (dateFrom) {
    queries.push(Query.greaterThanEqual('createdAt', dateFrom.toISOString()));
  }
  if (dateTo) {
    queries.push(Query.lessThanEqual('createdAt', dateTo.toISOString()));
  }

  // Add text search (Appwrite full-text search across title and description)
  if (q && q.trim().length) {
    const searchTerm = q.trim();

    // Search both title and description fields
    const titleResults = await prompts.list([
      Query.equal('isPublished', true),
      Query.search('title', searchTerm),
    ]);

    const descriptionResults = await prompts.list([
      Query.equal('isPublished', true),
      Query.search('description', searchTerm),
    ]);

    // Combine results and remove duplicates
    const combinedDocuments = [...titleResults.documents, ...descriptionResults.documents];

    // Remove duplicates by ID
    const uniqueDocuments = combinedDocuments.filter(
      (doc, index, self) => index === self.findIndex((d) => d.$id === doc.$id)
    );

    let promptModels = uniqueDocuments.map((doc) => convertToPromptModel(doc));

    // Apply category filter if specified
    if (category && category !== 'all') {
      promptModels = promptModels.filter((p) => p.category === category);
    }

    // Apply date filters if specified
    if (dateFrom) {
      promptModels = promptModels.filter((p) => p.createdAt >= dateFrom);
    }

    if (dateTo) {
      promptModels = promptModels.filter((p) => p.createdAt <= dateTo);
    }

    // Apply pagination
    const paginatedModels = promptModels.slice(0, limit);

    // Enrich with ratings
    const enrichedResults: SearchResult = [];

    for (const prompt of paginatedModels) {
      if (!prompt._id) continue;

      const ratingQueries = [Query.equal('promptId', prompt._id)];
      const ratingsResult = await ratings.list(ratingQueries);

      const promptRatings = ratingsResult.documents.map((doc) => doc.rating);
      const avgRating =
        promptRatings.length > 0
          ? promptRatings.reduce((sum, rating) => sum + rating, 0) / promptRatings.length
          : undefined;
      const ratingCount = promptRatings.length;

      // Apply minimum rating filter
      if (typeof minRating === 'number' && avgRating !== undefined && avgRating < minRating) {
        continue;
      }

      enrichedResults.push({
        ...prompt,
        avgRating,
        ratingCount,
        score: undefined, // Appwrite doesn't provide text score
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

  // Add sorting
  if (sort === 'newest') {
    queries.push(Query.orderDesc('createdAt'));
  } else {
    queries.push(Query.orderDesc('createdAt')); // Default to newest for now
  }

  // Add limit
  queries.push(Query.limit(limit));

  const result = await prompts.list(queries);
  const promptModels = result.documents.map((doc) => convertToPromptModel(doc));

  // For each prompt, fetch ratings and calculate averages
  // Note: This is less efficient than MongoDB aggregation but necessary with Appwrite
  const enrichedResults: SearchResult = [];

  for (const prompt of promptModels) {
    if (!prompt._id) continue;
    const ratingQueries = [Query.equal('promptId', prompt._id)];
    const ratingsResult = await ratings.list(ratingQueries);

    const promptRatings = ratingsResult.documents.map((doc) => doc.rating);
    const avgRating =
      promptRatings.length > 0
        ? promptRatings.reduce((sum, rating) => sum + rating, 0) / promptRatings.length
        : undefined;
    const ratingCount = promptRatings.length;

    // Apply minimum rating filter
    if (typeof minRating === 'number' && avgRating !== undefined && avgRating < minRating) {
      continue;
    }

    enrichedResults.push({
      ...prompt,
      avgRating,
      ratingCount,
      score: q ? undefined : undefined, // Appwrite doesn't provide text score
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

  return enrichedResults.slice(0, limit);
}
