import { ObjectId, WithId } from 'mongodb';
import { getDb } from '@/lib/mongo/client';
import { Rating, CreateRatingPayload, RatingStats, generateRatingStats } from '@/lib/models/rating';

// Internal type for MongoDB documents
type RatingDoc = Omit<Rating, '_id'> & { _id?: ObjectId };

class RatingRepository {
  private collectionName = 'ratings';

  private async getCollection() {
    const db = await getDb();
    return db.collection<RatingDoc>(this.collectionName);
  }

  private convertToRating(doc: WithId<RatingDoc>): Rating {
    return {
      ...doc,
      _id: doc._id.toString(),
    };
  }

  /**
   * Create a new rating
   */
  async createRating(payload: CreateRatingPayload): Promise<Rating> {
    const collection = await this.getCollection();
    const now = new Date();
    
    const ratingToInsert: Omit<RatingDoc, '_id'> = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(ratingToInsert);
    
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
      throw new Error('Failed to create rating');
    }

    return this.convertToRating(created);
  }

  /**
   * Get rating by ID
   */
  async getRatingById(id: string): Promise<Rating | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await this.getCollection();
    const rating = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!rating) {
      return null;
    }

    return this.convertToRating(rating);
  }

  /**
   * Get all ratings for a specific prompt
   */
  async getRatingsByPromptId(promptId: string): Promise<Rating[]> {
    const collection = await this.getCollection();
    const ratings = await collection.find({ promptId }).toArray();
    
    return ratings.map(rating => this.convertToRating(rating));
  }

  /**
   * Get rating by user and prompt (to check if user already rated)
   */
  async getRatingByUserAndPrompt(userId: string, promptId: string): Promise<Rating | null> {
    const collection = await this.getCollection();
    const rating = await collection.findOne({ userId, promptId });
    
    if (!rating) {
      return null;
    }

    return this.convertToRating(rating);
  }

  /**
   * Update an existing rating
   */
  async updateRating(id: string, updates: Partial<Pick<Rating, 'rating' | 'comment'>>): Promise<Rating | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await this.getCollection();
    const now = new Date();
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updates, 
          updatedAt: now 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return null;
    }

    return this.convertToRating(result);
  }

  /**
   * Delete a rating
   */
  async deleteRating(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    return result.deletedCount === 1;
  }

  /**
   * Get rating statistics for a prompt
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
    const ratings = await collection.find({ userId }).toArray();
    
    return ratings.map(rating => this.convertToRating(rating));
  }

  /**
   * Get recent ratings across all prompts (for admin/analytics)
   */
  async getRecentRatings(limit: number = 50): Promise<Rating[]> {
    const collection = await this.getCollection();
    const ratings = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    return ratings.map(rating => this.convertToRating(rating));
  }
}

// Export singleton instance
export const ratingRepo = new RatingRepository();
