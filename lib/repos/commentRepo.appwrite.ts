import { getCollections, CommentDoc, Query } from '../appwrite/collections';
import {
  Comment,
  CreateCommentPayload,
  UpdateCommentPayload,
  organizeCommentsIntoThreads,
  validateCreateComment,
  validateUpdateComment,
} from '../models/comment';

// Convert Appwrite document to Comment format
function convertToComment(doc: any): Comment {
  return {
    _id: doc.$id,
    promptId: doc.promptId,
    userId: doc.userId,
    content: doc.content,
    parentId: doc.parentId || undefined,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
    isEdited: doc.isEdited,
    isDeleted: doc.isDeleted,
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
    return convertToComment(result);
  }

  async getByPromptId(promptId: string) {
    const collection = await this.getCollection();
    const queries = [
      Query.equal('promptId', promptId),
      Query.equal('isDeleted', false),
      Query.orderAsc('createdAt'),
    ];

    const result = await collection.list(queries);
    const comments = result.documents.map((doc) => convertToComment(doc));
    return organizeCommentsIntoThreads(comments);
  }

  async getById(commentId: string): Promise<Comment | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.get(commentId);
      const comment = convertToComment(result);
      if (comment.isDeleted) return null;
      return comment;
    } catch (error: any) {
      if (error.code === 404) return null;
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
      return convertToComment(result);
    } catch (error: any) {
      if (error.code === 404) return null;
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
    } catch (error: any) {
      if (error.code === 404) return false;
      throw error;
    }
  }
}

export const commentRepo = new CommentRepository();
