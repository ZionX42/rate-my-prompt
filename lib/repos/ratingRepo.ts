import { getCollections, RatingDoc, Query } from '../appwrite/collections';
import { Rating, CreateRatingPayload, RatingStats, generateRatingStats } from '../models/rating';
import { ID } from '../appwrite/client';

// Convert Appwrite document to Rating format
function convertToRating(doc: any): Rating {
  return {
    _id: doc.$id,
    promptId: doc.promptId,
    userId: doc.userId,
    rating: doc.rating,
    comment: doc.comment || undefined,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

// Convert Rating to Appwrite document format
function convertToRatingDoc(rating: Omit<Rating, '_id'>): Omit<RatingDoc, '$id'> {
  return {
    promptId: rating.promptId,
    userId: rating.userId,
    rating: rating.rating,
    comment: rating.comment || '',
    createdAt: rating.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: rating.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

class RatingRepository {
  private async getCollection() {
    const { ratings } = await getCollections();
    return ratings;
  }

  /**
   * Create a new rating
   */
  async createRating(payload: CreateRatingPayload): Promise<Rating> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const ratingToInsert: Omit<Rating, '_id'> = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    const ratingDoc = convertToRatingDoc(ratingToInsert);
    const result = await collection.create(ratingDoc);
    return convertToRating(result);
  }

  /**
   * Get rating by ID
   */
  async getRatingById(id: string): Promise<Rating | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.get(id);
      return convertToRating(result);
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  /**
   * Get all ratings for a specific prompt
   */
  async getRatingsByPromptId(promptId: string): Promise<Rating[]> {
    const collection = await this.getCollection();
    const queries = [Query.equal('promptId', promptId)];
    
    const result = await collection.list(queries);
    return result.documents.map(doc => convertToRating(doc));
  }

  /**
   * Get rating by user and prompt (to check if user already rated)
   */
  async getRatingByUserAndPrompt(userId: string, promptId: string): Promise<Rating | null> {
    const collection = await this.getCollection();
    const queries = [
      Query.equal('userId', userId),
      Query.equal('promptId', promptId),
    ];
    
    const result = await collection.list(queries);
    if (result.documents.length === 0) return null;
    return convertToRating(result.documents[0]);
  }

  /**
   * Update an existing rating
   */
  async updateRating(id: string, updates: Partial<Pick<Rating, 'rating' | 'comment'>>): Promise<Rating | null> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      
      const updateData = {
        ...updates,
        updatedAt: now.toISOString(),
      };

      const result = await collection.update(id, updateData);
      return convertToRating(result);
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  /**
   * Delete a rating
   */
  async deleteRating(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      await collection.delete(id);
      return true;
    } catch (error: any) {
      if (error.code === 404) return false;
      throw error;
    }
  }

  /**
   * Get ratings statistics for a prompt
   */
  async getRatingStats(promptId: string): Promise<RatingStats> {
    const ratings = await this.getRatingsByPromptId(promptId);
    return generateRatingStats(ratings);
  }

  /**
   * Get all ratings by a specific user
   */
  async getRatingsByUserId(userId: string): Promise<Rating[]> {
    const collection = await this.getCollection();
    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('createdAt'),
    ];
    
    const result = await collection.list(queries);
    return result.documents.map(doc => convertToRating(doc));
  }

  /**
   * Get top rated prompts with their average ratings
   */
  async getTopRatedPrompts(limit = 10): Promise<Array<{ promptId: string; avgRating: number; ratingCount: number }>> {
    const collection = await this.getCollection();
    
    // Since Appwrite doesn't have aggregation, we need to fetch all ratings and group them
    const queries = [Query.limit(10000)]; // Adjust based on expected data size
    const result = await collection.list(queries);
    
    const promptRatings: Record<string, number[]> = {};
    
    result.documents.forEach(doc => {
      const rating = convertToRating(doc);
      if (!promptRatings[rating.promptId]) {
        promptRatings[rating.promptId] = [];
      }
      promptRatings[rating.promptId].push(rating.rating);
    });
    
    const topRated = Object.entries(promptRatings)
      .map(([promptId, ratings]) => ({
        promptId,
        avgRating: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
        ratingCount: ratings.length,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);
    
    return topRated;
  }
}

export const ratingRepo = new RatingRepository();
