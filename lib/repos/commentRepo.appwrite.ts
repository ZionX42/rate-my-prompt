import { getCollections, CommentDoc, Query } from '../appwrite/collections';
import {
  Comment,
  CreateCommentPayload,
  UpdateCommentPayload,
  organizeCommentsIntoThreads,
  validateCreateComment,
  validateUpdateComment,
} from '../models/comment';
import { AppwriteDocument } from '../types/appwrite';

// Convert Appwrite document to Comment format
function convertToComment(doc: AppwriteDocument): Comment {
  return {
    _id: doc.$id as string,
    promptId: doc.promptId as string,
    userId: doc.userId as string,
    content: doc.content as string,
    parentId: (doc.parentId as string) || undefined,
    createdAt: new Date(doc.createdAt as string),
    updatedAt: new Date(doc.updatedAt as string),
    isEdited: doc.isEdited as boolean,
    isDeleted: doc.isDeleted as boolean,
  };
}

// Convert Comment to Appwrite document format
function convertToCommentDoc(
  comment: Omit<Comment, '_id'>
): Omit<CommentDoc, '$id' | '$collectionId' | '$databaseId' | '$permissions' | '$sequence'> {
  return {
    promptId: comment.promptId,
    userId: comment.userId,
    content: comment.content,
    parentId: comment.parentId || '',
    $createdAt: comment.createdAt?.toISOString() || new Date().toISOString(),
    $updatedAt: comment.updatedAt?.toISOString() || new Date().toISOString(),
    isEdited: comment.isEdited,
    isDeleted: comment.isDeleted,
  };
}

class CommentRepository {
  private async getCollection() {
    const { comments } = await getCollections();
    return comments;
  }

  async create(promptId: string, payload: CreateCommentPayload): Promise<Comment> {
    const collection = await this.getCollection();
    const validatedPayload = validateCreateComment(payload);

    const now = new Date();
    const doc: Omit<Comment, '_id'> = {
      ...validatedPayload,
      promptId: promptId,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
      isDeleted: false,
    };

    const commentDoc = convertToCommentDoc(doc);
    const result = await collection.create(commentDoc);
    return convertToComment(result as unknown as AppwriteDocument);
  }

  async getByPromptId(promptId: string) {
    const collection = await this.getCollection();
    const queries = [
      Query.equal('promptId', promptId),
      Query.equal('isDeleted', false),
      Query.orderAsc('createdAt'),
    ];

    const result = await collection.list(queries);
    const comments = result.documents.map((doc) =>
      convertToComment(doc as unknown as AppwriteDocument)
    );
    return organizeCommentsIntoThreads(comments);
  }

  async getById(commentId: string): Promise<Comment | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.get(commentId);
      const comment = convertToComment(result as unknown as AppwriteDocument);
      if (comment.isDeleted) return null;
      return comment;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) return null;
      throw error;
    }
  }

  async update(
    commentId: string,
    userId: string,
    payload: UpdateCommentPayload
  ): Promise<Comment | null> {
    try {
      const collection = await this.getCollection();
      const validatedPayload = validateUpdateComment(payload);

      // First check if the comment exists and belongs to the user
      const existing = await this.getById(commentId);
      if (!existing || existing.userId !== userId || existing.isDeleted) {
        return null;
      }

      const updateData = {
        content: validatedPayload.content,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      };

      const result = await collection.update(commentId, updateData);
      return convertToComment(result as unknown as AppwriteDocument);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) return null;
      throw error;
    }
  }

  async softDelete(commentId: string, userId: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();

      // First check if the comment exists and belongs to the user
      const existing = await this.getById(commentId);
      if (!existing || existing.userId !== userId || existing.isDeleted) {
        return false;
      }

      const updateData = {
        isDeleted: true,
        content: '[deleted]',
        updatedAt: new Date().toISOString(),
      };

      await collection.update(commentId, updateData);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) return false;
      throw error;
    }
  }
}

export const commentRepo = new CommentRepository();
