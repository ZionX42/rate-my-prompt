import { Client, Databases, Storage, Users } from 'node-appwrite';
import type { Models } from 'node-appwrite';

type RequiredEnvKey =
  | 'APPWRITE_ENDPOINT'
  | 'APPWRITE_PROJECT_ID'
  | 'APPWRITE_API_KEY'
  | 'APPWRITE_DATABASE_ID'
  | 'APPWRITE_PROFILES_COLLECTION_ID'
  | 'APPWRITE_AVATAR_BUCKET_ID';

type OptionalEnvKey = 'APPWRITE_PROMPTS_COLLECTION_ID' | 'APPWRITE_GDPR_LOGS_COLLECTION_ID';

type EnvConfig = Record<RequiredEnvKey, string> & Partial<Record<OptionalEnvKey, string>>;

const cached: {
  client?: Client;
  databases?: Databases;
  storage?: Storage;
  users?: Users;
  env?: EnvConfig;
} = {};

function missingKeys(env: Record<string, string | undefined>): RequiredEnvKey[] {
  return (
    [
      'APPWRITE_ENDPOINT',
      'APPWRITE_PROJECT_ID',
      'APPWRITE_API_KEY',
      'APPWRITE_DATABASE_ID',
      'APPWRITE_PROFILES_COLLECTION_ID',
      'APPWRITE_AVATAR_BUCKET_ID',
    ] as const
  ).filter((key) => !env[key]);
}

export function getEnv(): EnvConfig {
  if (cached.env) return cached.env;

  const env = process.env as Record<string, string | undefined>;
  const missing = missingKeys(env);
  if (missing.length > 0) {
    throw new Error(`Missing required Appwrite environment variables: ${missing.join(', ')}`);
  }

  cached.env = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith('APPWRITE_'))
  ) as EnvConfig;
  return cached.env;
}

export function getAppwriteClient(): Client {
  if (cached.client) return cached.client;

  const env = getEnv();
  cached.client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT)
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY);
  return cached.client;
}

export function getDatabases(): Databases {
  if (cached.databases) return cached.databases;
  cached.databases = new Databases(getAppwriteClient());
  return cached.databases;
}

export function getStorage(): Storage {
  if (cached.storage) return cached.storage;
  cached.storage = new Storage(getAppwriteClient());
  return cached.storage;
}

export function getUsers(): Users {
  if (cached.users) return cached.users;
  cached.users = new Users(getAppwriteClient());
  return cached.users;
}

export type ProfileDoc = Models.Document & {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarFileId?: string;
  avatarUrl?: string;
  disabled?: boolean;
  privacyConsent?: boolean;
  createdAt: string;
  updatedAt: string;
};
