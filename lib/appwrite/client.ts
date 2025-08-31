import { Client, Databases, ID } from '@/lib/appwrite/sdk';

// Appwrite client configuration
let client: Client;
let databases: Databases;

export function getAppwriteClient(): Client {
  if (!client) {
    client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');
  }
  return client;
}

export function getAppwriteDatabases(): Databases {
  if (!databases) {
    databases = new Databases(getAppwriteClient());
  }
  return databases;
}

export async function getAppwriteDb() {
  const client = getAppwriteClient();
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'prompt-hub';

  // Ensure we have the required environment variables
  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    throw new Error(
      'Appwrite configuration missing: APPWRITE_PROJECT_ID and APPWRITE_API_KEY are required'
    );
  }

  return {
    client,
    databases: getAppwriteDatabases(),
    databaseId,
  };
}

// Utility for generating unique IDs
export { ID };

// Collections configuration
export const COLLECTIONS = {
  PROMPTS: 'prompts',
  COMMENTS: 'comments',
  RATINGS: 'ratings',
} as const;
