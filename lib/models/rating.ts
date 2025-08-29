import { z } from 'zod';

// Rating value must be between 1 and 5 stars
export const RatingValueSchema = z.number().min(1).max(5);

// Rating schema for validation
export const RatingSchema = z.object({
  _id: z.string().optional(),
  promptId: z.string().min(1, 'Prompt ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  rating: RatingValueSchema,
  comment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// TypeScript types derived from schema
export type Rating = z.infer<typeof RatingSchema>;
export type RatingValue = z.infer<typeof RatingValueSchema>;

// For creating new ratings
export type CreateRatingPayload = Omit<Rating, '_id' | 'createdAt' | 'updatedAt'>;

// For aggregated rating statistics
export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Validation functions
export function validateRating(data: unknown): Rating {
  return RatingSchema.parse(data);
}

export function validateCreateRating(data: unknown): CreateRatingPayload {
  const CreateRatingSchema = RatingSchema.omit({ 
    _id: true, 
    createdAt: true, 
    updatedAt: true 
  }).strict(); // Use strict to prevent additional fields
  return CreateRatingSchema.parse(data);
}

// Helper function to calculate average rating
export function calculateAverageRating(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;
  
  const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
}

// Helper function to generate rating distribution
export function generateRatingDistribution(ratings: Rating[]): RatingStats['ratingDistribution'] {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  ratings.forEach(rating => {
    const value = rating.rating as keyof typeof distribution;
    distribution[value]++;
  });
  
  return distribution;
}

// Helper function to generate full rating statistics
export function generateRatingStats(ratings: Rating[]): RatingStats {
  return {
    averageRating: calculateAverageRating(ratings),
    totalRatings: ratings.length,
    ratingDistribution: generateRatingDistribution(ratings),
  };
}
