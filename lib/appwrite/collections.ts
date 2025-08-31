import { getAppwriteDb, COLLECTIONS, ID } from './client';
import { Query } from 'node-appwrite';

// Document type definitions that match MongoDB schemas
export interface PromptDoc {
  $id: string;
  title: string;
  content: string;
  authorId: string;
  description?: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

export interface CommentDoc {
  $id: string;
  promptId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface RatingDoc {
  $id: string;
  promptId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCollections() {
  const { databases, databaseId } = await getAppwriteDb();
  
  return {
    prompts: {
      collectionId: COLLECTIONS.PROMPTS,
      create: (data: Omit<PromptDoc, '$id'>) => 
        databases.createDocument(databaseId, COLLECTIONS.PROMPTS, ID.unique(), data),
      get: (documentId: string) => 
        databases.getDocument(databaseId, COLLECTIONS.PROMPTS, documentId),
      list: (queries: string[] = []) => 
        databases.listDocuments(databaseId, COLLECTIONS.PROMPTS, queries),
      update: (documentId: string, data: Partial<PromptDoc>) => 
        databases.updateDocument(databaseId, COLLECTIONS.PROMPTS, documentId, data),
      delete: (documentId: string) => 
        databases.deleteDocument(databaseId, COLLECTIONS.PROMPTS, documentId),
    },
    comments: {
      collectionId: COLLECTIONS.COMMENTS,
      create: (data: Omit<CommentDoc, '$id'>) => 
        databases.createDocument(databaseId, COLLECTIONS.COMMENTS, ID.unique(), data),
      get: (documentId: string) => 
        databases.getDocument(databaseId, COLLECTIONS.COMMENTS, documentId),
      list: (queries: string[] = []) => 
        databases.listDocuments(databaseId, COLLECTIONS.COMMENTS, queries),
      update: (documentId: string, data: Partial<CommentDoc>) => 
        databases.updateDocument(databaseId, COLLECTIONS.COMMENTS, documentId, data),
      delete: (documentId: string) => 
        databases.deleteDocument(databaseId, COLLECTIONS.COMMENTS, documentId),
    },
    ratings: {
      collectionId: COLLECTIONS.RATINGS,
      create: (data: Omit<RatingDoc, '$id'>) => 
        databases.createDocument(databaseId, COLLECTIONS.RATINGS, ID.unique(), data),
      get: (documentId: string) => 
        databases.getDocument(databaseId, COLLECTIONS.RATINGS, documentId),
      list: (queries: string[] = []) => 
        databases.listDocuments(databaseId, COLLECTIONS.RATINGS, queries),
      update: (documentId: string, data: Partial<RatingDoc>) => 
        databases.updateDocument(databaseId, COLLECTIONS.RATINGS, documentId, data),
      delete: (documentId: string) => 
        databases.deleteDocument(databaseId, COLLECTIONS.RATINGS, documentId),
    },
  };
}

// Collection setup function to create collections and attributes
export async function ensureCollections() {
  const { databases, databaseId } = await getAppwriteDb();
  
  try {
    // Create prompts collection
    await databases.createCollection(
      databaseId,
      COLLECTIONS.PROMPTS,
      'Prompts',
      undefined, // permissions
      false // documentSecurity
    );
    
    // Create prompts attributes
    await databases.createStringAttribute(databaseId, COLLECTIONS.PROMPTS, 'title', 200, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.PROMPTS, 'content', 10000, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.PROMPTS, 'authorId', 50, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.PROMPTS, 'description', 500, false);
    await databases.createStringAttribute(databaseId, COLLECTIONS.PROMPTS, 'category', 50, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.PROMPTS, 'tags', 50, false, undefined, true); // array
    await databases.createBooleanAttribute(databaseId, COLLECTIONS.PROMPTS, 'isPublished', true, false);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.PROMPTS, 'createdAt', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.PROMPTS, 'updatedAt', true);
    
    // Create indexes for prompts
    await databases.createIndex(databaseId, COLLECTIONS.PROMPTS, 'authorId_idx', 'key', ['authorId']);
    await databases.createIndex(databaseId, COLLECTIONS.PROMPTS, 'category_idx', 'key', ['category']);
    await databases.createIndex(databaseId, COLLECTIONS.PROMPTS, 'published_idx', 'key', ['isPublished']);
    await databases.createIndex(databaseId, COLLECTIONS.PROMPTS, 'created_idx', 'key', ['createdAt']);
    
  } catch (error) {
    // Collection might already exist
    console.log('Prompts collection might already exist:', error);
  }
  
  try {
    // Create comments collection
    await databases.createCollection(
      databaseId,
      COLLECTIONS.COMMENTS,
      'Comments',
      undefined,
      false
    );
    
    // Create comments attributes
    await databases.createStringAttribute(databaseId, COLLECTIONS.COMMENTS, 'promptId', 50, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.COMMENTS, 'userId', 50, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.COMMENTS, 'content', 2000, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.COMMENTS, 'parentId', 50, false);
    await databases.createBooleanAttribute(databaseId, COLLECTIONS.COMMENTS, 'isEdited', true, false);
    await databases.createBooleanAttribute(databaseId, COLLECTIONS.COMMENTS, 'isDeleted', true, false);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.COMMENTS, 'createdAt', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.COMMENTS, 'updatedAt', true);
    
    // Create indexes for comments
    await databases.createIndex(databaseId, COLLECTIONS.COMMENTS, 'promptId_idx', 'key', ['promptId']);
    await databases.createIndex(databaseId, COLLECTIONS.COMMENTS, 'userId_idx', 'key', ['userId']);
    await databases.createIndex(databaseId, COLLECTIONS.COMMENTS, 'created_idx', 'key', ['createdAt']);
    
  } catch (error) {
    console.log('Comments collection might already exist:', error);
  }
  
  try {
    // Create ratings collection
    await databases.createCollection(
      databaseId,
      COLLECTIONS.RATINGS,
      'Ratings',
      undefined,
      false
    );
    
    // Create ratings attributes
    await databases.createStringAttribute(databaseId, COLLECTIONS.RATINGS, 'promptId', 50, true);
    await databases.createStringAttribute(databaseId, COLLECTIONS.RATINGS, 'userId', 50, true);
    await databases.createIntegerAttribute(databaseId, COLLECTIONS.RATINGS, 'rating', true, 1, 5);
    await databases.createStringAttribute(databaseId, COLLECTIONS.RATINGS, 'comment', 1000, false);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.RATINGS, 'createdAt', true);
    await databases.createDatetimeAttribute(databaseId, COLLECTIONS.RATINGS, 'updatedAt', true);
    
    // Create indexes for ratings
    await databases.createIndex(databaseId, COLLECTIONS.RATINGS, 'promptId_idx', 'key', ['promptId']);
    await databases.createIndex(databaseId, COLLECTIONS.RATINGS, 'userId_idx', 'key', ['userId']);
    await databases.createIndex(databaseId, COLLECTIONS.RATINGS, 'user_prompt_idx', 'key', ['userId', 'promptId']);
    
  } catch (error) {
    console.log('Ratings collection might already exist:', error);
  }
}

export { Query };
