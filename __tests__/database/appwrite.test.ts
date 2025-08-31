import { describe, it, expect } from '@jest/globals';

describe('Appwrite configuration', () => {
  const isNodeEnv = typeof window === 'undefined';
  const hasEnv = !!process.env.APPWRITE_PROJECT_ID && !!process.env.APPWRITE_API_KEY;

  const testOrSkip = isNodeEnv && hasEnv ? it : it.skip;

  testOrSkip('has APPWRITE configuration', async () => {
    const { getAppwriteDb } = await import('../../lib/appwrite/client');
    const { ensureCollections } = await import('../../lib/appwrite/collections');

    const { databases, databaseId } = await getAppwriteDb();
    await ensureCollections();

    expect(databases).toBeDefined();
    expect(databaseId).toBeDefined();
    expect(typeof databaseId).toBe('string');
  });
});
