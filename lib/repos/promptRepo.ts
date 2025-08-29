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
