import { Collection, Db } from 'mongodb';
import { getDb } from './client';

export type PromptDoc = {
  _id?: any;
  title: string;
  description?: string;
  content: string;
  authorId: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublished?: boolean;
};

export type RatingDoc = {
  _id?: any;
  promptId: string;
  userId: string;
  value: number; // 1..5
  createdAt: Date;
  updatedAt: Date;
};

export type CommentDoc = {
  _id?: any;
  promptId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getCollections(db?: Db): Promise<{
  prompts: Collection<PromptDoc>;
  ratings: Collection<RatingDoc>;
  comments: Collection<CommentDoc>;
}> {
  const database = db ?? (await getDb());
  const prompts = database.collection<PromptDoc>('prompts');
  const ratings = database.collection<RatingDoc>('ratings');
  const comments = database.collection<CommentDoc>('comments');
  return { prompts, ratings, comments };
}

export async function ensureIndexes(db?: Db): Promise<void> {
  const { prompts, ratings, comments } = await getCollections(db);

  await prompts.createIndexes([
    { key: { authorId: 1, createdAt: -1 } },
    { key: { title: 'text', description: 'text', content: 'text' }, weights: { title: 5, description: 3, content: 1 }, name: 'text_search' },
    { key: { category: 1 } },
    { key: { tags: 1 } },
  ]);

  await ratings.createIndexes([
    { key: { promptId: 1, userId: 1 }, unique: true },
    { key: { promptId: 1 } },
    { key: { userId: 1 } },
  ]);

  await comments.createIndexes([
    { key: { promptId: 1, createdAt: -1 } },
    { key: { userId: 1 } },
    { key: { parentId: 1 } },
  ]);
}
