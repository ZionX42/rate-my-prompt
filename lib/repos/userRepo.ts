import { getCollections } from '../appwrite/collections';
import { ID } from '@/lib/appwrite/sdk';
import {
  User as UserProfile,
  ProfileUpdateInput,
  validateProfileUpdate,
  sanitizeProfileUpdate,
} from '../models/user';

// Document type for User in Appwrite
interface UserDoc {
  $id: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  joinedAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

// Convert Appwrite document to UserProfile format
function convertToUserProfile(doc: any): UserProfile {
  return {
    _id: doc.$id,
    displayName: doc.displayName,
    email: doc.email,
    bio: doc.bio,
    avatarUrl: doc.avatarUrl,
    joinedAt: new Date(doc.joinedAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

// Convert UserProfile to Appwrite document format
function convertToUserDoc(profile: Partial<UserProfile>): Partial<UserDoc> {
  const doc: Partial<UserDoc> = {};

  if (profile.displayName !== undefined) doc.displayName = profile.displayName;
  if (profile.email !== undefined) doc.email = profile.email;
  if (profile.bio !== undefined) doc.bio = profile.bio;
  if (profile.avatarUrl !== undefined) doc.avatarUrl = profile.avatarUrl;
  if (profile.joinedAt !== undefined) doc.joinedAt = profile.joinedAt.toISOString();
  if (profile.updatedAt !== undefined) doc.updatedAt = profile.updatedAt.toISOString();

  return doc;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    // For now, we assume users collection exists or will be created by auth system
    const { users } = await getCollections();
    const result = await users.get(userId);
    return convertToUserProfile(result);
  } catch (error: any) {
    if (error.code === 404) return null;
    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput
): Promise<UserProfile> {
  const validation = validateProfileUpdate(input);
  if (!validation.ok) {
    const err = new Error('Invalid profile update input');
    (err as any).issues = validation.issues;
    throw err;
  }

  const { users } = await getCollections();

  // Get current profile first
  const currentUser = await users.get(userId);
  if (!currentUser) {
    throw new Error('User not found');
  }

  const sanitizedInput = sanitizeProfileUpdate(input);
  const now = new Date();

  const updateData = {
    ...convertToUserDoc(sanitizedInput),
    updatedAt: now.toISOString(),
  };

  const result = await users.update(userId, updateData);
  return convertToUserProfile(result);
}
