/**
 * Comprehensive test helper for mocking Appwrite dependencies
 * This file should be imported before any modules that use Appwrite
 */

import { jest } from '@jest/globals';

const createListMock = () =>
  jest.fn(async () => ({
    documents: [] as unknown[],
    total: 0,
  }));

// Mock the entire node-appwrite module
export const mockAppwrite = () => {
  jest.mock('node-appwrite', () => ({
    Client: jest.fn().mockImplementation(() => ({
      setEndpoint: jest.fn().mockReturnThis(),
      setProject: jest.fn().mockReturnThis(),
      setKey: jest.fn().mockReturnThis(),
    })),
    Databases: jest.fn().mockImplementation(() => ({
      listDocuments: createListMock(),
      getDocument: jest.fn(),
      createDocument: jest.fn(),
      updateDocument: jest.fn(),
      deleteDocument: jest.fn(),
    })),
    Query: {
      equal: jest.fn((field, value) => `equal("${field}", "${value}")`),
      search: jest.fn((field, value) => `search("${field}", "${value}")`),
      limit: jest.fn((count) => `limit(${count})`),
      offset: jest.fn((count) => `offset(${count})`),
      orderDesc: jest.fn((field) => `orderDesc("${field}")`),
      orderAsc: jest.fn((field) => `orderAsc("${field}")`),
    },
    ID: {
      unique: jest.fn(() => 'mock-unique-id'),
    },
    Permission: {
      read: jest.fn(),
      write: jest.fn(),
    },
    Role: {
      any: jest.fn(),
      user: jest.fn(),
    },
  }));
};

// Mock Appwrite client module
export const mockAppwriteClient = () => {
  jest.mock('@/lib/appwrite/client', () => ({
    __esModule: true,
    getAppwriteDb: jest.fn(async () => ({
      databases: {
        listDocuments: createListMock(),
        getDocument: jest.fn(),
        createDocument: jest.fn(),
      },
      databaseId: 'test-database-id',
    })),
    COLLECTIONS: {
      PROMPTS: 'prompts',
      COMMENTS: 'comments',
      RATINGS: 'ratings',
      USERS: 'users',
    },
    ID: { unique: jest.fn(() => 'mock-id') },
  }));
};

// Mock Appwrite collections
export const mockAppwriteCollections = () => {
  jest.mock('@/lib/appwrite/collections', () => ({
    __esModule: true,
    getCollections: jest.fn(async () => ({
      prompts: {
        collectionId: 'prompts',
        list: createListMock(),
        get: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      ratings: {
        collectionId: 'ratings',
        list: createListMock(),
        get: jest.fn(),
        create: jest.fn(),
      },
      comments: {
        collectionId: 'comments',
        list: createListMock(),
        get: jest.fn(),
        create: jest.fn(),
      },
      users: {
        collectionId: 'users',
        list: createListMock(),
        get: jest.fn(),
        create: jest.fn(),
      },
    })),
  }));
};

// Mock repository functions
export const mockPromptRepo = () => {
  jest.mock('@/lib/repos/promptRepo', () => ({
    __esModule: true,
    searchPrompts: jest.fn(),
    searchAllCollections: jest.fn(),
    getPromptsPaginated: jest.fn(),
    createPrompt: jest.fn(),
    getPromptById: jest.fn(),
    updatePrompt: jest.fn(),
    deletePrompt: jest.fn(),
  }));
};

// Setup all mocks
export const setupAppwriteMocks = () => {
  mockAppwrite();
  mockAppwriteClient();
  mockAppwriteCollections();
  mockPromptRepo();
};

// Test environment setup
export const setupTestEnv = () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    APPWRITE_PROJECT_ID: 'test-project-id',
    APPWRITE_API_KEY: 'test-api-key',
    APPWRITE_ENDPOINT: 'https://test.appwrite.io/v1',
  });
};
