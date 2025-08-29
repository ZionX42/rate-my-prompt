import { describe, it, expect } from '@jest/globals';
import {
  CommentSchema,
  validateComment,
  validateCreateComment,
  validateUpdateComment,
  isTopLevelComment,
  isReply,
  generateCommentStats,
  organizeCommentsIntoThreads,
  Comment,
  CreateCommentPayload,
  UpdateCommentPayload,
} from '@/lib/models/comment';

describe('Comment Model', () => {
  const validComment: Comment = {
    _id: '507f1f77bcf86cd799439011',
    promptId: '507f1f77bcf86cd799439012',
    userId: 'user123',
    content: 'This is a great prompt! Very helpful for my use case.',
    parentId: null,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    isEdited: false,
    isDeleted: false,
  };

  const validReply: Comment = {
    _id: '507f1f77bcf86cd799439013',
    promptId: '507f1f77bcf86cd799439012',
    userId: 'user456',
    content: 'I agree! This prompt saved me hours of work.',
    parentId: '507f1f77bcf86cd799439011',
    createdAt: new Date('2024-01-15T11:00:00Z'),
    updatedAt: new Date('2024-01-15T11:00:00Z'),
    isEdited: false,
    isDeleted: false,
  };

  describe('CommentSchema validation', () => {
    it('validates a valid comment', () => {
      expect(() => CommentSchema.parse(validComment)).not.toThrow();
    });

    it('requires promptId', () => {
      const invalidComment = { ...validComment, promptId: '' };
      expect(() => CommentSchema.parse(invalidComment)).toThrow('Prompt ID is required');
    });

    it('requires userId', () => {
      const invalidComment = { ...validComment, userId: '' };
      expect(() => CommentSchema.parse(invalidComment)).toThrow('User ID is required');
    });

    it('requires content', () => {
      const invalidComment = { ...validComment, content: '' };
      expect(() => CommentSchema.parse(invalidComment)).toThrow('Comment content is required');
    });

    it('validates content length limits', () => {
      const longContent = 'a'.repeat(2001);
      const invalidComment = { ...validComment, content: longContent };
      expect(() => CommentSchema.parse(invalidComment)).toThrow('Comment cannot exceed 2000 characters');
    });

    it('allows parentId to be null or undefined', () => {
      const commentWithNullParent = { ...validComment, parentId: null };
      const commentWithUndefinedParent = { ...validComment, parentId: undefined };
      
      expect(() => CommentSchema.parse(commentWithNullParent)).not.toThrow();
      expect(() => CommentSchema.parse(commentWithUndefinedParent)).not.toThrow();
    });

    it('sets default values for optional fields', () => {
      const minimalComment = {
        promptId: '507f1f77bcf86cd799439012',
        userId: 'user123',
        content: 'Test comment',
      };
      
      const parsed = CommentSchema.parse(minimalComment);
      expect(parsed.isEdited).toBe(false);
      expect(parsed.isDeleted).toBe(false);
    });
  });

  describe('validateComment function', () => {
    it('validates and returns a valid comment', () => {
      const result = validateComment(validComment);
      expect(result).toEqual(validComment);
    });

    it('throws error for invalid comment', () => {
      const invalidComment = { ...validComment, content: '' };
      expect(() => validateComment(invalidComment)).toThrow();
    });
  });

  describe('validateCreateComment function', () => {
    it('validates create comment payload', () => {
      const createPayload: CreateCommentPayload = {
        promptId: '507f1f77bcf86cd799439012',
        userId: 'user123',
        content: 'New comment content',
        parentId: null,
      };
      
      const result = validateCreateComment(createPayload);
      expect(result).toEqual(createPayload);
    });

    it('rejects additional fields in strict mode', () => {
      const invalidPayload = {
        promptId: '507f1f77bcf86cd799439012',
        userId: 'user123',
        content: 'New comment content',
        extraField: 'should not be allowed',
      };
      
      expect(() => validateCreateComment(invalidPayload)).toThrow();
    });
  });

  describe('validateUpdateComment function', () => {
    it('validates update comment payload', () => {
      const updatePayload: UpdateCommentPayload = {
        content: 'Updated comment content',
      };
      
      const result = validateUpdateComment(updatePayload);
      expect(result).toEqual(updatePayload);
    });

    it('requires content for updates', () => {
      const invalidPayload = { content: '' };
      expect(() => validateUpdateComment(invalidPayload)).toThrow('Comment content is required');
    });

    it('validates content length for updates', () => {
      const longContent = 'a'.repeat(2001);
      const invalidPayload = { content: longContent };
      expect(() => validateUpdateComment(invalidPayload)).toThrow('Comment cannot exceed 2000 characters');
    });
  });

  describe('isTopLevelComment function', () => {
    it('returns true for comments without parentId', () => {
      expect(isTopLevelComment(validComment)).toBe(true);
    });

    it('returns false for comments with parentId', () => {
      expect(isTopLevelComment(validReply)).toBe(false);
    });

    it('returns true for comments with null parentId', () => {
      const commentWithNullParent = { ...validComment, parentId: null };
      expect(isTopLevelComment(commentWithNullParent)).toBe(true);
    });
  });

  describe('isReply function', () => {
    it('returns false for comments without parentId', () => {
      expect(isReply(validComment)).toBe(false);
    });

    it('returns true for comments with parentId', () => {
      expect(isReply(validReply)).toBe(true);
    });

    it('returns false for comments with null parentId', () => {
      const commentWithNullParent = { ...validComment, parentId: null };
      expect(isReply(commentWithNullParent)).toBe(false);
    });
  });

  describe('generateCommentStats function', () => {
    it('calculates correct stats for comments with replies', () => {
      const comments = [validComment, validReply];
      const stats = generateCommentStats(comments);
      
      expect(stats.totalComments).toBe(1); // Only top-level comments
      expect(stats.totalReplies).toBe(1);
      expect(stats.latestComment).toEqual(validReply.createdAt);
    });

    it('excludes deleted comments from stats', () => {
      const deletedComment = { ...validComment, isDeleted: true };
      const comments = [deletedComment, validReply];
      const stats = generateCommentStats(comments);
      
      expect(stats.totalComments).toBe(0); // Deleted comment excluded
      expect(stats.totalReplies).toBe(1);
    });

    it('handles empty comments array', () => {
      const stats = generateCommentStats([]);
      
      expect(stats.totalComments).toBe(0);
      expect(stats.totalReplies).toBe(0);
      expect(stats.latestComment).toBeUndefined();
    });
  });

  describe('organizeCommentsIntoThreads function', () => {
    it('organizes comments into threads correctly', () => {
      const comments = [validComment, validReply];
      const threads = organizeCommentsIntoThreads(comments);
      
      expect(threads).toHaveLength(1);
      expect(threads[0].comment).toEqual(validComment);
      expect(threads[0].replies).toHaveLength(1);
      expect(threads[0].replies[0]).toEqual(validReply);
      expect(threads[0].replyCount).toBe(1);
    });

    it('sorts threads by creation date (newest first)', () => {
      const olderComment = { 
        ...validComment, 
        _id: 'older',
        createdAt: new Date('2024-01-14T10:30:00Z') 
      };
      const newerComment = { 
        ...validComment, 
        _id: 'newer',
        createdAt: new Date('2024-01-16T10:30:00Z') 
      };
      
      const threads = organizeCommentsIntoThreads([olderComment, newerComment]);
      
      expect(threads[0].comment._id).toBe('newer');
      expect(threads[1].comment._id).toBe('older');
    });

    it('sorts replies by creation date (oldest first)', () => {
      const olderReply = { 
        ...validReply, 
        _id: 'older-reply',
        createdAt: new Date('2024-01-15T11:00:00Z') 
      };
      const newerReply = { 
        ...validReply, 
        _id: 'newer-reply',
        createdAt: new Date('2024-01-15T12:00:00Z') 
      };
      
      const comments = [validComment, newerReply, olderReply];
      const threads = organizeCommentsIntoThreads(comments);
      
      expect(threads[0].replies[0]._id).toBe('older-reply');
      expect(threads[0].replies[1]._id).toBe('newer-reply');
    });

    it('excludes deleted comments from threads', () => {
      const deletedComment = { ...validComment, isDeleted: true };
      const comments = [deletedComment, validReply];
      const threads = organizeCommentsIntoThreads(comments);
      
      expect(threads).toHaveLength(0); // Deleted top-level comment excluded
    });

    it('handles comments without creation dates', () => {
      const commentWithoutDate = { ...validComment, createdAt: undefined };
      const threads = organizeCommentsIntoThreads([commentWithoutDate]);
      
      expect(threads).toHaveLength(1);
      expect(threads[0].comment).toEqual(commentWithoutDate);
    });
  });
});
