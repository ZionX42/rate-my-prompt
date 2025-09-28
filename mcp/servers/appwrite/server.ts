#!/usr/bin/env ts-node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z, ZodRawShape } from '@modelcontextprotocol/sdk/node_modules/zod';
import dotenv from 'dotenv';
import { Client, Databases, Query } from 'node-appwrite';

dotenv.config({ path: '.env.local' });
dotenv.config();

function createDatabasesClient(databaseOverride?: string): {
  databases: Databases;
  databaseId: string;
} {
  const endpoint = process.env.APPWRITE_ENDPOINT ?? '';
  const projectId = process.env.APPWRITE_PROJECT_ID ?? '';
  const apiKey = process.env.APPWRITE_API_KEY ?? '';
  const defaultDatabaseId = process.env.APPWRITE_DATABASE_ID ?? '';

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      'Missing Appwrite credentials. Ensure APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY are set.'
    );
  }

  const activeDatabaseId = databaseOverride ?? defaultDatabaseId;

  if (!activeDatabaseId) {
    throw new Error(
      'Database ID is required. Set APPWRITE_DATABASE_ID or provide databaseId in the tool input.'
    );
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  return {
    databases: new Databases(client),
    databaseId: activeDatabaseId,
  };
}

function normalizeInput(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const server = new McpServer({
  name: 'appwrite-mcp',
  version: '0.1.0',
  description: 'Interact with Appwrite databases through the Model Context Protocol.',
});

const listCollectionsInput = {
  databaseId: z
    .string()
    .optional()
    .describe('Optional override for the Appwrite database ID. Defaults to APPWRITE_DATABASE_ID.'),
} satisfies ZodRawShape;

server.registerTool(
  'list_collections',
  {
    title: 'List Appwrite Collections',
    description: 'Retrieve the collections available within the configured Appwrite database.',
    inputSchema: listCollectionsInput,
  },
  async ({ databaseId }) => {
    try {
      const { databases, databaseId: activeDb } = createDatabasesClient(databaseId);
      const result = await databases.listCollections(activeDb);

      const summary = result.collections
        .map((collection) => `• ${collection.$id} — ${collection.name}`)
        .join('\n');

      const content = summary || 'No collections found.';

      return {
        content: [
          {
            type: 'text' as const,
            text: `Collections in database ${activeDb}:\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to list collections: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

const listDocumentsInput = {
  collectionId: z.string().describe('Appwrite collection ID to list documents from.'),
  databaseId: z
    .string()
    .optional()
    .describe('Optional override for the Appwrite database ID. Defaults to APPWRITE_DATABASE_ID.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of documents to return. Defaults to Appwrite API default.'),
} satisfies ZodRawShape;

server.registerTool(
  'list_documents',
  {
    title: 'List Appwrite Documents',
    description: 'Retrieve documents from a specific Appwrite collection.',
    inputSchema: listDocumentsInput,
  },
  async ({ collectionId, databaseId, limit }) => {
    try {
      const { databases, databaseId: activeDb } = createDatabasesClient(databaseId);
      const queries = limit ? [Query.limit(limit)] : undefined;
      const result = await databases.listDocuments(activeDb, collectionId, queries);

      const formatted = result.documents
        .map((doc) => `• ${doc.$id} — ${JSON.stringify(doc, null, 2)}`)
        .join('\n\n');

      const content = formatted || 'No documents found.';

      return {
        content: [
          {
            type: 'text' as const,
            text: `Documents in ${collectionId}:\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to list documents: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

const getDocumentInput = {
  collectionId: z.string().describe('Appwrite collection ID.'),
  documentId: z.string().describe('Appwrite document ID.'),
  databaseId: z
    .string()
    .optional()
    .describe('Optional override for the Appwrite database ID. Defaults to APPWRITE_DATABASE_ID.'),
} satisfies ZodRawShape;

server.registerTool(
  'get_document',
  {
    title: 'Get Appwrite Document',
    description: 'Retrieve a single document by ID from an Appwrite collection.',
    inputSchema: getDocumentInput,
  },
  async ({ collectionId, documentId, databaseId }) => {
    try {
      const { databases, databaseId: activeDb } = createDatabasesClient(databaseId);
      const document = await databases.getDocument(activeDb, collectionId, documentId);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(document, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to fetch document: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

const documentResourceTemplate = new ResourceTemplate(
  'appwrite://database/{databaseId}/collection/{collectionId}/document/{documentId}',
  {
    list: async () => ({
      resources: [],
    }),
  }
);

server.registerResource(
  'appwrite-document',
  documentResourceTemplate,
  {
    title: 'Appwrite Document',
    description: 'Fetch a specific Appwrite document as JSON.',
    mimeType: 'application/json',
  },
  async (uri, { databaseId, collectionId, documentId }) => {
    const resolvedDb = normalizeInput(databaseId);
    const resolvedCollection = normalizeInput(collectionId);
    const resolvedDocument = normalizeInput(documentId);

    if (!resolvedCollection || !resolvedDocument) {
      throw new Error('Both collectionId and documentId are required.');
    }

    const { databases, databaseId: activeDb } = createDatabasesClient(resolvedDb);
    const document = await databases.getDocument(activeDb, resolvedCollection, resolvedDocument);

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(document, null, 2),
          mimeType: 'application/json',
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('[appwrite-mcp] Fatal error:', error);
  process.exit(1);
});
