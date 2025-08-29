import { z } from 'zod';

// Comment schema for validation
export const CommentSchema = z.object({
  _id: z.string().optional(),
  promptId: z.string().min(1, 'Prompt ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment cannot exceed 2000 characters'),
  parentId: z.string().optional().nullable(), // For threaded comments
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  isEdited: z.boolean().optional().default(false),
  isDeleted: z.boolean().optional().default(false),
});

// TypeScript types derived from schema
export type Comment = z.infer<typeof CommentSchema>;

// For creating new comments
export type CreateCommentPayload = Omit<Comment, '_id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'isDeleted'>;

// For updating existing comments
export type UpdateCommentPayload = {
  content: string;
};

// For comment statistics and threading
export interface CommentStats {
  totalComments: number;
  totalReplies: number;
  latestComment?: Date;
}

export interface CommentThread {
  comment: Comment;
  replies: Comment[];
  replyCount: number;
}

// Validation functions
export function validateComment(data: unknown): Comment {
  return CommentSchema.parse(data);
}

export function validateCreateComment(data: unknown): CreateCommentPayload {
  const CreateCommentSchema = CommentSchema.omit({ 
    _id: true, 
    createdAt: true, 
    updatedAt: true,
    isEdited: true,
    isDeleted: true
  }).strict(); // Use strict to prevent additional fields
  return CreateCommentSchema.parse(data);
}

export function validateUpdateComment(data: unknown): UpdateCommentPayload {
  const UpdateCommentSchema = z.object({
    content: z.string().min(1, 'Comment content is required').max(2000, 'Comment cannot exceed 2000 characters'),
  }).strict();
  return UpdateCommentSchema.parse(data);
}

// Helper function to check if a comment is a top-level comment
export function isTopLevelComment(comment: Comment): boolean {
  return !comment.parentId;
}

// Helper function to check if a comment is a reply
export function isReply(comment: Comment): boolean {
  return Boolean(comment.parentId);
}

// Helper function to generate comment statistics
export function generateCommentStats(comments: Comment[]): CommentStats {
  const visibleComments = comments.filter(comment => !comment.isDeleted);
  const topLevelComments = visibleComments.filter(isTopLevelComment);
  const replies = visibleComments.filter(isReply);
  
  const latestComment = visibleComments
    .filter(comment => comment.createdAt)
    .sort((a, b) => (b.createdAt!.getTime() - a.createdAt!.getTime()))[0]?.createdAt;

  return {
    totalComments: topLevelComments.length,
    totalReplies: replies.length,
    latestComment,
  };
}

// Helper function to organize comments into threads
export function organizeCommentsIntoThreads(comments: Comment[]): CommentThread[] {
  const visibleComments = comments.filter(comment => !comment.isDeleted);
  const topLevelComments = visibleComments.filter(isTopLevelComment);
  const repliesMap = new Map<string, Comment[]>();

  // Group replies by parent ID
  visibleComments.filter(isReply).forEach(reply => {
    const parentId = reply.parentId!;
    if (!repliesMap.has(parentId)) {
      repliesMap.set(parentId, []);
    }
    repliesMap.get(parentId)!.push(reply);
  });

  // Sort replies by creation date
  repliesMap.forEach(replies => {
    replies.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  });

  // Create threads
  return topLevelComments
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
    })
    .map(comment => {
      const commentId = comment._id!;
      const replies = repliesMap.get(commentId) || [];
      return {
        comment,
        replies,
        replyCount: replies.length,
      };
    });
}
