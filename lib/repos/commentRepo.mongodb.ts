import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongo/client';
import { getCollections } from '@/lib/mongo/collections';
import { Comment, CreateCommentPayload, UpdateCommentPayload, organizeCommentsIntoThreads, validateCreateComment, validateUpdateComment } from '@/lib/models/comment';

// Internal type for MongoDB documents
type CommentDoc = Omit<Comment, '_id' | 'promptId'> & { _id?: ObjectId; promptId: ObjectId };

class CommentRepository {
  private async getCollection() {
    const db = await getDb();
    return (await getCollections(db)).comments;
  }

  async create(promptId: string, payload: CreateCommentPayload): Promise<Comment> {
    const collection = await this.getCollection();
    const validatedPayload = validateCreateComment(payload);
    
    const now = new Date();
    const doc: Omit<CommentDoc, '_id'> = {
      ...validatedPayload,
      promptId: new ObjectId(promptId),
      createdAt: now,
      updatedAt: now,
      isEdited: false,
      isDeleted: false,
    };

    const result = await collection.insertOne(doc as any);
    return { ...doc, _id: result.insertedId.toHexString(), promptId: promptId };
  }

  async getByPromptId(promptId: string) {
    const collection = await this.getCollection();
    const comments = await collection
      .find({ promptId: new ObjectId(promptId), isDeleted: false })
      .sort({ createdAt: 1 })
      .toArray();
    
    const mappedComments = comments.map(c => ({ ...c, _id: c._id.toHexString(), promptId: c.promptId.toHexString() })) as Comment[];
    return organizeCommentsIntoThreads(mappedComments);
  }

  async getById(commentId: string): Promise<Comment | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ _id: new ObjectId(commentId), isDeleted: false });
    if (!doc) return null;
    return { ...doc, _id: doc._id.toHexString(), promptId: doc.promptId.toHexString() } as Comment;
  }

  async update(commentId: string, userId: string, payload: UpdateCommentPayload): Promise<Comment | null> {
    const collection = await this.getCollection();
    const validatedPayload = validateUpdateComment(payload);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(commentId), userId, isDeleted: false },
      {
        $set: {
          content: validatedPayload.content,
          isEdited: true,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) return null;
    return { ...result, _id: result._id.toHexString(), promptId: result.promptId.toHexString() } as Comment;
  }

  async softDelete(commentId: string, userId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(commentId), userId, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          content: '[deleted]',
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount === 1;
  }
}

export const commentRepo = new CommentRepository();
