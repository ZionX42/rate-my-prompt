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
import { buildSearchQuery, enrichPrompts } from './promptRepo.helpers';

function convertToPromptModel({ $id, $createdAt, $updatedAt, ...rest }: PromptDoc): PromptModel {
  return {
    _id: $id,
    ...rest,
    category: rest.category as PromptCategory,
    createdAt: new Date($createdAt),
    updatedAt: new Date($updatedAt),
  };
}

function convertToPromptDoc({ _id, createdAt, updatedAt, ...rest }: PromptModel): Omit<PromptDoc, keyof Models.Document> {
  return {
    ...rest,
    description: rest.description || '',
    category: rest.category || 'general',
    tags: rest.tags || [],
    isPublished: rest.isPublished || false,
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

  const promptDoc = convertToPromptDoc(model as PromptModel);
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
  return result.documents.map(convertToPromptModel);
}

export async function getFeaturedPrompts(limit = 6): Promise<PromptModel[]> {
  const { prompts } = await getCollections();
  const queries = [
    Query.equal('isPublished', true),
    Query.orderDesc('createdAt'),
    Query.limit(limit),
  ];

  const result = await prompts.list(queries);
  return result.documents.map(convertToPromptModel);
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
  return result.documents.map(convertToPromptModel);
}

export async function getCategoryStats(): Promise<Array<{ category: string; count: number }>> {
  const { prompts } = await getCollections();
  const queries = [
    Query.equal('isPublished', true),
    Query.limit(1000),
  ];

  const result = await prompts.list(queries);
  const categoryCount: Record<string, number> = {};

  result.documents.forEach((doc) => {
    const category = doc.category || 'general';
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
  minRating?: number;
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
  const { q, limit = 50, offset = 0, sort = 'relevance', minRating } = params;
  const { prompts } = await getCollections();

  let promptModels: PromptModel[];

  if (q && q.trim().length) {
    const searchTerm = q.trim();
    const titleResults = await prompts.list([
      Query.equal('isPublished', true),
      Query.search('title', searchTerm),
    ]);
    const descriptionResults = await prompts.list([
      Query.equal('isPublished', true),
      Query.search('description', searchTerm),
    ]);

    const combinedDocuments = [...titleResults.documents, ...descriptionResults.documents];
    const uniqueDocuments = combinedDocuments.filter(
      (doc, index, self) => index === self.findIndex((d) => d.$id === doc.$id)
    );
    promptModels = uniqueDocuments.map(convertToPromptModel);

  } else {
    const queries = buildSearchQuery(params);
    if (offset > 0) {
        queries.push(Query.cursorAfter(offset.toString()));
    }
    queries.push(Query.limit(limit));
    const result = await prompts.list(queries);
    promptModels = result.documents.map(convertToPromptModel);
  }

  const enrichedResults = await enrichPrompts(promptModels, q, minRating);

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

export async function getPromptsByTags(tags: string[], limit = 20): Promise<PromptModel[]> {
  const { prompts } = await getCollections();
  const queries = [Query.equal('isPublished', true)];

  if (tags.length > 0) {
    for (const tag of tags) {
      queries.push(Query.search('tags', tag));
    }
  }

  queries.push(Query.orderDesc('createdAt'));
  queries.push(Query.limit(limit));

  const result = await prompts.list(queries);
  return result.documents.map(convertToPromptModel);
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
  return result.documents.map(convertToPromptModel);
}

export type CrossCollectionSearchResult = {
  prompts: SearchResult;
  users: UserDoc[];
  comments: CommentDoc[];
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

  const promptResults = await searchPrompts({ ...params, collection: 'prompts' });

  return {
    prompts: promptResults,
    users: [],
    comments: [],
    totalCount: promptResults.length,
  };
}

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
    totalCount: results.length,
    hasNextPage: results.length === limit,
    hasPrevPage: page > 1,
    currentPage: page,
  };
}
