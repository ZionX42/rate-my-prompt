import { describe, it, expect } from '@jest/globals';

describe('MongoDB configuration', () => {
  it('has MONGODB_URI configured or skips gracefully', async () => {
    if (!process.env.MONGODB_URI) {
      expect(true).toBe(true); // Skip when not configured
      return;
    }

    const { getDb } = await import('../../lib/mongo/client');
    const { getCollections, ensureIndexes } = await import('../../lib/mongo/collections');

    const db = await getDb();
    await ensureIndexes(db);
    const { prompts, ratings, comments } = await getCollections(db);

    // Touch the collections to ensure they are accessible
    expect(prompts.collectionName).toBe('prompts');
    expect(ratings.collectionName).toBe('ratings');
    expect(comments.collectionName).toBe('comments');
  });
});
