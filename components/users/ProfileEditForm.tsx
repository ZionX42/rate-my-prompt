'use client';

import React, { useEffect, useState } from 'react';
import { ProfileUpdateInput } from '@/lib/models/user';

type ProfileUpdateResponse = {
  _id: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  updatedAt?: string;
};

interface ProfileEditFormProps {
  userId: string;
  initialData: ProfileUpdateInput;
  canEdit?: boolean;
  onProfileUpdated?: (payload: ProfileUpdateResponse) => void;
}

export default function ProfileEditForm({
  userId,
  initialData,
  canEdit = true,
  onProfileUpdated,
}: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateInput>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-subtext">
        You don&apos;t have permission to edit this profile.
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const updatedUser: ProfileUpdateResponse = await response.json();

      setFormData({
        displayName: updatedUser.displayName ?? '',
        bio: updatedUser.bio ?? '',
        avatarUrl: updatedUser.avatarUrl ?? '',
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      onProfileUpdated?.(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditing) {
    return (
      <div>
        <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm px-4 py-2">
          Edit Profile
        </button>
        {success && <p className="mt-2 text-green-600 text-sm">{success}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <h2 className="text-lg font-medium">Edit Profile</h2>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium mb-1">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName || ''}
          onChange={handleChange}
          className="input-field w-full"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio || ''}
          onChange={handleChange}
          className="input-field w-full h-24"
          placeholder="Tell us about yourself"
        />
      </div>

      <div>
        <label htmlFor="avatarUrl" className="block text-sm font-medium mb-1">
          Avatar URL
        </label>
        <input
          type="url"
          id="avatarUrl"
          name="avatarUrl"
          value={formData.avatarUrl || ''}
          onChange={handleChange}
          className="input-field w-full"
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-4 py-2">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setFormData(initialData);
            setError(null);
          }}
          className="btn-ghost px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
