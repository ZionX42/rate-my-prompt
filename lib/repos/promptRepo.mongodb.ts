import { ObjectId } from 'mongodb';
import { getDb } from '../mongo/client';
import { getCollections } from '../mongo/collections';
import { NewPromptInput, PromptModel, sanitizeNewPrompt, validateNewPrompt } from '../models/prompt';

export async function createPrompt(input: NewPromptInput): Promise<PromptModel> {
  const validation = validateNewPrompt(input);
  if (!validation.ok) {
    const err = new Error('Invalid prompt input');
    (err as any).issues = validation.issues;
    throw err;
  }
  const db = await getDb();
  const { prompts } = await getCollections(db);
  const now = new Date();
  const doc: PromptModel = {
    ...sanitizeNewPrompt(input),
    createdAt: now,
    updatedAt: now,
  };
  const res = await prompts.insertOne(doc as any);
  return { ...doc, _id: res.insertedId };
}

export async function getPromptById(id: string): Promise<PromptModel | null> {
  const db = await getDb();
  const { prompts } = await getCollections(db);
  const _id = new ObjectId(id);
  return (await prompts.findOne({ _id })) as PromptModel | null;
}

export async function listPromptsByAuthor(authorId: string, limit = 20): Promise<PromptModel[]> {
  const db = await getDb();
  const { prompts } = await getCollections(db);
  return (await prompts
    .find({ authorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()) as PromptModel[];
}

export async function getFeaturedPrompts(limit = 6): Promise<PromptModel[]> {
  const db = await getDb();
  const { prompts } = await getCollections(db);
  return (await prompts
    .find({ isPublished: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()) as PromptModel[];
}

export async function getPromptsByCategory(category: string, limit = 20): Promise<PromptModel[]> {
  const db = await getDb();
  const { prompts } = await getCollections(db);
  return (await prompts
    .find({ isPublished: true, category })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()) as PromptModel[];
}

export async function getCategoryStats(): Promise<Array<{ category: string; count: number }>> {
  const db = await getDb();
  const { prompts } = await getCollections(db);
  const stats = await prompts.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  return stats.map(stat => ({
    category: stat._id || 'general',
    count: stat.count
  }));
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
  const {
    q,
    category,
    minRating,
    dateFrom,
    dateTo,
    limit = 50,
    sort = 'relevance',
  } = params;

  const db = await getDb();
  const { prompts } = await getCollections(db);

  const match: any = { isPublished: true };
  if (category && category !== 'all') match.category = category;
  if (dateFrom || dateTo) {
    match.createdAt = {} as any;
    if (dateFrom) match.createdAt.$gte = dateFrom;
    if (dateTo) match.createdAt.$lte = dateTo;
  }

  const pipeline: any[] = [];

  // Text search when q provided
  if (q && q.trim().length) {
    pipeline.push({ $match: { $text: { $search: q.trim() } } });
    // Include text score for sorting
    pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
  }

  // Apply other filters
  pipeline.push({ $match: match });

  // Join ratings to compute average
  pipeline.push(
    {
      $lookup: {
        from: 'ratings',
        localField: '_id',
        foreignField: 'promptId',
        as: 'ratings',
      },
    },
    { $addFields: { avgRating: { $avg: '$ratings.value' }, ratingCount: { $size: '$ratings' } } }
  );

  if (typeof minRating === 'number') {
    pipeline.push({ $match: { $or: [ { avgRating: { $gte: minRating } }, { ratingCount: 0 } ] } });
  }

  // Sorting
  if (sort === 'newest') {
    pipeline.push({ $sort: { createdAt: -1 } });
  } else if (sort === 'rating') {
    pipeline.push({ $sort: { avgRating: -1, ratingCount: -1, createdAt: -1 } });
  } else if (q && q.trim().length) {
    pipeline.push({ $sort: { score: -1 } });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push({ $limit: limit });

  const results = await prompts.aggregate(pipeline).toArray();
  // Map to PromptModel shape, ensure optional fields are present
  return results as SearchResult;
}
