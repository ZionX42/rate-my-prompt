import { z } from 'zod';

// User profile data model
import {
  sanitizeDisplayName,
  sanitizeBio,
  sanitizeUrl,
  detectMaliciousPatterns,
} from '@/lib/security/sanitize';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export interface User {
  _id: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  joinedAt: Date;
  updatedAt: Date;
  // Add any additional fields needed for user profiles
}

export interface ProfileUpdateInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters.' })
    .max(50, { message: 'Display name cannot exceed 50 characters.' })
    .optional(),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters.' }).optional(),
  avatarUrl: z.string().url({ message: 'Avatar URL must be a valid URL.' }).optional(),
});

export function validateProfileUpdate(input: ProfileUpdateInput) {
  const result = profileUpdateSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  return { ok: true, issues: [] };
}

// Sanitize input before saving to database
export function sanitizeProfileUpdate(input: ProfileUpdateInput): ProfileUpdateInput {
  // Check for malicious patterns in all fields
  const fieldsToCheck = [input.displayName, input.bio, input.avatarUrl].filter(Boolean);
  if (fieldsToCheck.some((field) => detectMaliciousPatterns(field!))) {
    throw new Error('Potentially malicious content detected');
  }

  return {
    ...(input.displayName !== undefined && { displayName: sanitizeDisplayName(input.displayName) }),
    ...(input.bio !== undefined && { bio: sanitizeBio(input.bio) }),
    ...(input.avatarUrl !== undefined && { avatarUrl: sanitizeUrl(input.avatarUrl) }),
  };
}
