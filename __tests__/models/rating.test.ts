import { describe, it, expect } from '@jest/globals';
import '@testing-library/jest-dom';
import {
  Rating,
  RatingSchema,
  validateRating,
  validateCreateRating,
  calculateAverageRating,
  generateRatingDistribution,
  generateRatingStats,
} from '@/lib/models/rating';

describe('Rating Model', () => {
  const validRatingData = {
    promptId: 'prompt-123',
    userId: 'user-456',
    rating: 4,
    comment: 'Great prompt!',
  };

  describe('RatingSchema validation', () => {
    it('validates a complete rating object', () => {
      const rating = {
        _id: 'rating-123',
        ...validRatingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = RatingSchema.safeParse(rating);
      expect(result.success).toBe(true);
    });

    it('validates rating without optional fields', () => {
      const rating = {
        promptId: 'prompt-123',
        userId: 'user-456',
        rating: 3,
      };

      const result = RatingSchema.safeParse(rating);
      expect(result.success).toBe(true);
    });

    it('rejects rating below 1', () => {
      const rating = { ...validRatingData, rating: 0 };
      const result = RatingSchema.safeParse(rating);
      expect(result.success).toBe(false);
    });

    it('rejects rating above 5', () => {
      const rating = { ...validRatingData, rating: 6 };
      const result = RatingSchema.safeParse(rating);
      expect(result.success).toBe(false);
    });

    it('rejects empty promptId', () => {
      const rating = { ...validRatingData, promptId: '' };
      const result = RatingSchema.safeParse(rating);
      expect(result.success).toBe(false);
    });

    it('rejects empty userId', () => {
      const rating = { ...validRatingData, userId: '' };
      const result = RatingSchema.safeParse(rating);
      expect(result.success).toBe(false);
    });

    it('rejects comment over 500 characters', () => {
      const longComment = 'a'.repeat(501);
      const rating = { ...validRatingData, comment: longComment };
      const result = RatingSchema.safeParse(rating);
      expect(result.success).toBe(false);
    });
  });

  describe('validateRating function', () => {
    it('returns valid rating object', () => {
      const result = validateRating(validRatingData);
      expect(result.promptId).toBe('prompt-123');
      expect(result.userId).toBe('user-456');
      expect(result.rating).toBe(4);
    });

    it('throws error for invalid data', () => {
      expect(() => validateRating({ rating: 6 })).toThrow();
    });
  });

  describe('validateCreateRating function', () => {
    it('validates creation payload', () => {
      const result = validateCreateRating(validRatingData);
      expect(result.promptId).toBe('prompt-123');
      expect(result.rating).toBe(4);
    });

    it('rejects data with _id field', () => {
      const dataWithId = { ...validRatingData, _id: 'should-not-exist' };
      expect(() => validateCreateRating(dataWithId)).toThrow();
    });
  });

  describe('calculateAverageRating function', () => {
    it('calculates correct average', () => {
      const ratings: Rating[] = [
        { ...validRatingData, rating: 5 },
        { ...validRatingData, rating: 3 },
        { ...validRatingData, rating: 4 },
      ];

      const average = calculateAverageRating(ratings);
      expect(average).toBe(4.0);
    });

    it('rounds to 1 decimal place', () => {
      const ratings: Rating[] = [
        { ...validRatingData, rating: 5 },
        { ...validRatingData, rating: 4 },
        { ...validRatingData, rating: 3 },
      ];

      const average = calculateAverageRating(ratings);
      expect(average).toBe(4.0);
    });

    it('returns 0 for empty array', () => {
      const average = calculateAverageRating([]);
      expect(average).toBe(0);
    });
  });

  describe('generateRatingDistribution function', () => {
    it('creates correct distribution', () => {
      const ratings: Rating[] = [
        { ...validRatingData, rating: 5 },
        { ...validRatingData, rating: 5 },
        { ...validRatingData, rating: 4 },
        { ...validRatingData, rating: 3 },
        { ...validRatingData, rating: 1 },
      ];

      const distribution = generateRatingDistribution(ratings);
      expect(distribution).toEqual({
        5: 2,
        4: 1,
        3: 1,
        2: 0,
        1: 1,
      });
    });

    it('returns all zeros for empty array', () => {
      const distribution = generateRatingDistribution([]);
      expect(distribution).toEqual({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      });
    });
  });

  describe('generateRatingStats function', () => {
    it('generates complete statistics', () => {
      const ratings: Rating[] = [
        { ...validRatingData, rating: 5 },
        { ...validRatingData, rating: 4 },
        { ...validRatingData, rating: 3 },
      ];

      const stats = generateRatingStats(ratings);
      expect(stats.averageRating).toBe(4.0);
      expect(stats.totalRatings).toBe(3);
      expect(stats.ratingDistribution[5]).toBe(1);
      expect(stats.ratingDistribution[4]).toBe(1);
      expect(stats.ratingDistribution[3]).toBe(1);
    });

    it('handles empty ratings array', () => {
      const stats = generateRatingStats([]);
      expect(stats.averageRating).toBe(0);
      expect(stats.totalRatings).toBe(0);
      expect(Object.values(stats.ratingDistribution).every(count => count === 0)).toBe(true);
    });
  });
});
