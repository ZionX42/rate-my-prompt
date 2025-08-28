import { getDb } from '../lib/mongo/client';
import { ensureIndexes } from '../lib/mongo/collections';

async function main() {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    console.log('MongoDB collections are ready.');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up MongoDB collections:', err);
    process.exit(1);
  }
}

main();
