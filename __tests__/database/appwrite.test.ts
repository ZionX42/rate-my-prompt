import { describe, it, expect } from '@jest/globals';

describe('Appwrite configuration', () => {
  it('has APPWRITE configuration or skips gracefully', async () => {
    if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
      expect(true).toBe(true); // Skip when not configured
      return;
    }

    const { getAppwriteDb } = await import('../../lib/appwrite/client');
    const { ensureCollections } = await import('../../lib/appwrite/collections');

    const { databases, databaseId } = await getAppwriteDb();
    await ensureCollections();

    // Test that we can access the configuration
    expect(databases).toBeDefined();
    expect(databaseId).toBeDefined();
    expect(typeof databaseId).toBe('string');
  });
});
