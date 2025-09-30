import 'server-only';

// Server-side configuration for sensitive environment variables
// This file should only be imported in server-side code (API routes, server components)

export const serverConfig = {
  // Appwrite Configuration
  appwrite: {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || '',
    apiKey: process.env.APPWRITE_API_KEY || '',
    databaseId: process.env.APPWRITE_DATABASE_ID || 'rate-my-prompt-db',
    profilesCollectionId: process.env.APPWRITE_PROFILES_COLLECTION_ID || '',
    avatarBucketId: process.env.APPWRITE_AVATAR_BUCKET_ID || '',
    promptsCollectionId: process.env.APPWRITE_PROMPTS_COLLECTION_ID || '',
    gdprLogsCollectionId: process.env.APPWRITE_GDPR_LOGS_COLLECTION_ID || '',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || '',
    mongoUri: process.env.MONGODB_URI || '',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Redis Configuration (if used)
  redis: {
    url: process.env.REDIS_URL || '',
  },

  // Other sensitive configuration
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
};

// Validation function to ensure all required environment variables are set
export function validateServerConfig() {
  const requiredVars = [
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_PROFILES_COLLECTION_ID',
    'APPWRITE_AVATAR_BUCKET_ID',
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
