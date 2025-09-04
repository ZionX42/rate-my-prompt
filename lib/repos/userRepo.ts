import { getCollections } from '../appwrite/collections';
import { Query } from '@/lib/appwrite/sdk';
import {
  User as UserProfile,
  ProfileUpdateInput,
  validateProfileUpdate,
  sanitizeProfileUpdate,
  Role,
} from '../models/user';
import type { UserDoc } from '../appwrite/collections';

// Convert Appwrite document to UserProfile format
function convertToUserProfile(doc: UserDoc): UserProfile {
  return {
    _id: doc.$id,
    displayName: doc.displayName,
    email: doc.email,
    bio: doc.bio,
    avatarUrl: doc.avatarUrl,
    role: doc.role as Role,
    isActive: doc.isActive ?? true,
    joinedAt: new Date(doc.joinedAt),
    updatedAt: new Date(doc.$updatedAt || doc.joinedAt),
  };
}

// Convert UserProfile to Appwrite document format
function convertToUserDoc(profile: Partial<UserProfile>): Partial<UserDoc> {
  const doc: Partial<UserDoc> = {};

  if (profile.displayName !== undefined) doc.displayName = profile.displayName;
  if (profile.email !== undefined) doc.email = profile.email;
  if (profile.bio !== undefined) doc.bio = profile.bio;
  if (profile.avatarUrl !== undefined) doc.avatarUrl = profile.avatarUrl;
  if (profile.role !== undefined) doc.role = profile.role;
  if (profile.isActive !== undefined) doc.isActive = profile.isActive;
  if (profile.joinedAt !== undefined) doc.joinedAt = profile.joinedAt.toISOString();

  return doc;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const { users } = await getCollections();
    const result = await users.get(userId);
    return convertToUserProfile(result);
  } catch (error: unknown) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const { users } = await getCollections();
    const result = await users.list([Query.equal('email', email)]);

    if (result.documents.length === 0) {
      return null;
    }

    return convertToUserProfile(result.documents[0]);
  } catch (error: unknown) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function createUser(
  userData: Omit<UserProfile, '_id' | 'joinedAt' | 'updatedAt'>
): Promise<UserProfile> {
  try {
    const { users } = await getCollections();

    const userDoc: Omit<
      UserDoc,
      | '$id'
      | '$createdAt'
      | '$updatedAt'
      | '$collectionId'
      | '$databaseId'
      | '$permissions'
      | '$sequence'
    > = {
      displayName: userData.displayName,
      email: userData.email,
      role: userData.role,
      isActive: userData.isActive ?? true,
      joinedAt: new Date().toISOString(),
    };

    const result = await users.create(userDoc);
    return convertToUserProfile(result);
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    throw new Error(
      `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput
): Promise<UserProfile> {
  const validation = validateProfileUpdate(input);
  if (!validation.ok) {
    const err = new Error('Invalid profile update input') as Error & { issues: unknown };
    err.issues = validation.issues;
    throw err;
  }

  const { users } = await getCollections();

  // Get current profile first
  const currentUser = await users.get(userId);
  if (!currentUser) {
    throw new Error('User not found');
  }

  const sanitizedInput = sanitizeProfileUpdate(input);

  const updateData = {
    ...convertToUserDoc(sanitizedInput),
  };

  const result = await users.update(userId, updateData);
  return convertToUserProfile(result);
}
