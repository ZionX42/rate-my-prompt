import { Client, Databases, ID } from '@/lib/appwrite/sdk';
import { serverConfig, validateServerConfig } from '@/lib/config/server';
import 'server-only';

// Appwrite client configuration - SERVER SIDE ONLY
let client: Client;
let databases: Databases;

export function getAppwriteClient(): Client {
  if (!client) {
    // Validate configuration before creating client
    validateServerConfig();

    client = new Client()
      .setEndpoint(serverConfig.appwrite.endpoint)
      .setProject(serverConfig.appwrite.projectId)
      .setKey(serverConfig.appwrite.apiKey);
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
  const databaseId = serverConfig.appwrite.databaseId;

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
  USERS: 'users',
} as const;
