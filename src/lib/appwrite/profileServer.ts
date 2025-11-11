import 'server-only';

import type { Models } from 'node-appwrite';
import { Client, Databases, Storage, Users } from '@/lib/appwrite/sdk';
import { serverConfig } from '@/lib/config/server';

export interface ProfileDocument extends Models.Document {
  userId: string | null;
  username: string;
  displayName: string;
  bio?: string;
  avatarFileId?: string;
  avatarUrl?: string;
  disabled?: boolean;
  privacyConsent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileEnvConfig {
  endpoint: string;
  projectId: string;
  apiKey: string;
  databaseId: string;
  profilesCollectionId: string;
  avatarBucketId: string;
  promptsCollectionId?: string;
  gdprLogsCollectionId?: string;
}

const cache: {
  env?: ProfileEnvConfig;
  client?: Client;
  databases?: Databases;
  storage?: Storage;
  users?: Users;
} = {};

function resolveEnv(): ProfileEnvConfig {
  if (cache.env) {
    return cache.env;
  }

  const {
    endpoint,
    projectId,
    apiKey,
    databaseId,
    profilesCollectionId,
    avatarBucketId,
    promptsCollectionId,
    gdprLogsCollectionId,
  } = serverConfig.appwrite;

  const required: Array<[string, string | undefined]> = [
    ['APPWRITE_ENDPOINT', endpoint],
    ['APPWRITE_PROJECT_ID', projectId],
    ['APPWRITE_API_KEY', apiKey],
    ['APPWRITE_DATABASE_ID', databaseId],
    ['APPWRITE_PROFILES_COLLECTION_ID', profilesCollectionId],
    ['APPWRITE_AVATAR_BUCKET_ID', avatarBucketId],
  ];

  const missing = required.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`Missing required Appwrite configuration: ${missing.join(', ')}`);
  }

  cache.env = {
    endpoint,
    projectId,
    apiKey,
    databaseId,
    profilesCollectionId,
    avatarBucketId,
    promptsCollectionId: promptsCollectionId || undefined,
    gdprLogsCollectionId: gdprLogsCollectionId || undefined,
  };

  return cache.env;
}

export function getProfileEnv(): ProfileEnvConfig {
  return resolveEnv();
}

export function getProfileClient(): Client {
  if (!cache.client) {
    const env = resolveEnv();
    cache.client = new Client()
      .setEndpoint(env.endpoint)
      .setProject(env.projectId)
      .setKey(env.apiKey);
  }
  return cache.client;
}

export function getProfileDatabases(): Databases {
  if (!cache.databases) {
    cache.databases = new Databases(getProfileClient());
  }
  return cache.databases;
}

export function getProfileStorage(): Storage {
  if (!cache.storage) {
    cache.storage = new Storage(getProfileClient());
  }
  return cache.storage;
}

export function getProfileUsers(): Users {
  if (!cache.users) {
    cache.users = new Users(getProfileClient());
  }
  return cache.users;
}
