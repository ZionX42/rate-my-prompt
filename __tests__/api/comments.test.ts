/** @jest-environment node */

import { describe, it, expect, jest, afterEach, beforeAll } from '@jest/globals';
import { GET, POST } from '@/app/api/prompts/[id]/comments/route';
import { PATCH, DELETE } from '@/app/api/prompts/[id]/comments/[commentId]/route';
import { commentRepo } from '@/lib/repos/commentRepo';
import { Comment, CommentThread } from '@/lib/models/comment';
import { NextRequest } from 'next/server';

// Ensure storage env is present for route handlers
beforeAll(() => {
  process.env.APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || 'test-project';
  process.env.APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'test-key';
});

// Use spies on the real exported repo so methods are mockable with correct shapes
describe('Comments API', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/prompts/[id]/comments', () => {
    it('should return threaded comments', async () => {
      const threadedComments: CommentThread[] = [];
      jest.spyOn(commentRepo, 'getByPromptId').mockResolvedValue(threadedComments);

      const response = await GET(new NextRequest('http://localhost/api/prompts/123/comments'), {
        params: Promise.resolve({ id: '123' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual([]);
      expect(commentRepo.getByPromptId).toHaveBeenCalledWith('123');
    });
  });

  describe('POST /api/prompts/[id]/comments', () => {
    it('should create a comment and return it', async () => {
      const newComment = { userId: 'user1', content: 'A new comment' };
      const createdComment: Comment = {
        ...newComment,
        _id: 'cm1',
        promptId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        isDeleted: false,
      };
      jest.spyOn(commentRepo, 'create').mockResolvedValue(createdComment);

      const request = new NextRequest('http://localhost/api/prompts/123/comments', {
        method: 'POST',
        body: JSON.stringify(newComment),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request, { params: Promise.resolve({ id: '123' }) });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toHaveProperty('_id', 'cm1');
      expect(commentRepo.create).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({ ...newComment, promptId: '123' })
      );
    });
  });

  describe('PATCH /api/prompts/[id]/comments/[commentId]', () => {
    it('should update a comment', async () => {
      const updatePayload = { content: 'Updated content', userId: 'user1' };
      const updatedComment: Comment = {
        _id: 'c1',
        promptId: 'p1',
        userId: 'user1',
        content: 'Updated content',
        isEdited: true,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(commentRepo, 'update').mockResolvedValue(updatedComment);

      const request = new NextRequest('http://localhost/api/prompts/p1/comments/c1', {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'p1', commentId: 'c1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.content).toBe('Updated content');
      expect(commentRepo.update).toHaveBeenCalledWith('c1', 'user1', {
        content: 'Updated content',
      });
    });
  });

  describe('DELETE /api/prompts/[id]/comments/[commentId]', () => {
    it('should soft delete a comment', async () => {
      jest.spyOn(commentRepo, 'softDelete').mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/prompts/p1/comments/c1', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'user1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'p1', commentId: 'c1' }),
      });

      expect(response.status).toBe(204);
      expect(commentRepo.softDelete).toHaveBeenCalledWith('c1', 'user1');
    });

    it('should return 404 if comment not found or user not authorized', async () => {
      jest.spyOn(commentRepo, 'softDelete').mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/prompts/p1/comments/c1', {
        method: 'DELETE',
        body: JSON.stringify({ userId: 'user1' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'p1', commentId: 'c1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain('not found or user not authorized');
    });
  });
});
