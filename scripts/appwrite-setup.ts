import dotenv from 'dotenv';
import { getAppwriteDb } from '../lib/appwrite/client';
import { ensureCollections } from '../lib/appwrite/collections';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Setting up Appwrite collections...');
    
    // Test connection
    const { client, databases, databaseId } = await getAppwriteDb();
    console.log(`Connected to Appwrite project: ${process.env.APPWRITE_PROJECT_ID}`);
    console.log(`Database ID: ${databaseId}`);
    
    // Create database if it doesn't exist
    try {
      await databases.get(databaseId);
      console.log('Database already exists');
    } catch (error: any) {
      if (error.code === 404) {
        console.log('Creating database...');
        await databases.create(databaseId, 'Prompt Hub Database', true);
        console.log('Database created successfully');
      } else {
        throw error;
      }
    }
    
    // Ensure collections exist
    await ensureCollections();
    console.log('Appwrite collections are ready.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error setting up Appwrite collections:', err);
    process.exit(1);
  }
}

main();
