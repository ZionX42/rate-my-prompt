import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useState } from 'react';

const MAX_DISPLAY_NAME = 120;
const MAX_USERNAME = 64;
const MAX_BIO = 1024;
const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MiB

type ProfileDraft = {
  displayName?: string;
  username?: string;
  bio?: string;
  disabled?: boolean;
  avatarUrl?: string;
};

type FormErrors = Record<string, string>;

function validateProfileInput(draft: ProfileDraft, file: File | null): FormErrors {
  const errors: FormErrors = {};

  if (draft.displayName && draft.displayName.length > MAX_DISPLAY_NAME) {
    errors.displayName = `Display name must be ${MAX_DISPLAY_NAME} characters or fewer.`;
  }

  if (draft.username && draft.username.length > MAX_USERNAME) {
    errors.username = `Username must be ${MAX_USERNAME} characters or fewer.`;
  }

  if (draft.bio && draft.bio.length > MAX_BIO) {
    errors.bio = `Bio must be ${MAX_BIO} characters or fewer.`;
  }

  if (file) {
    if (!SUPPORTED_AVATAR_TYPES.includes(file.type)) {
      errors.avatar = 'Unsupported file type. Please upload PNG, JPEG, or WEBP.';
    }

    if (file.size > MAX_AVATAR_SIZE) {
      errors.avatar = 'Avatar exceeds 5 MiB maximum size.';
    }
  }

  return errors;
}

export function ProfileForm() {
  const { profile, draft, setDraft, jwtToken, loginRedirect, setFeedback, setProfile } = useUserProfile();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const usernameAvailability = useUsernameAvailability(draft.username ?? '', jwtToken, profile?.username);

  const handleAvatarSelection = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    setAvatarFile(file);
  };

  const handleInputChange = (field: keyof ProfileDraft, value: any) => {
    let nextValue = value;

    if (field === 'username' && typeof value === 'string') {
      nextValue = value.trim().toLowerCase();
    }

    setDraft((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!jwtToken) {
      setFeedback('Authentication expired. Please refresh the page.');
      return;
    }

    const validationErrors = validateProfileInput(draft, avatarFile);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const formData = new FormData();
    if (draft.displayName !== undefined) formData.append('displayName', draft.displayName ?? '');
    if (draft.username !== undefined) formData.append('username', draft.username ?? '');
    if (draft.bio !== undefined) formData.append('bio', draft.bio ?? '');
    if (typeof draft.disabled === 'boolean') formData.append('disabled', String(draft.disabled));
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      setSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        body: formData,
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'X-Appwrite-JWT': jwtToken,
        },
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        loginRedirect();
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.reason || 'Profile update failed.');
      }

      setProfile(payload.data);
      setDraft(payload.data);
      setAvatarFile(null);
      setFeedback('Profile updated successfully.');
    } catch (error) {
      console.error('Profile update failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-page__form">
      <header className="profile-page__header">
        <div>
          <h1>Edit profile</h1>
          <p>Update your public profile information and account preferences.</p>
        </div>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </header>

      <section>
        <label>
          Display name
          <input
            type="text"
            value={draft.displayName ?? ''}
            onChange={(event) => handleInputChange('displayName', event.target.value)}
            maxLength={MAX_DISPLAY_NAME}
            required
          />
        </label>
        {errors.displayName && <p className="field-error">{errors.displayName}</p>}
      </section>

      <section>
        <label>
          Username
          <input
            type="text"
            value={draft.username ?? ''}
            onChange={(event) => handleInputChange('username', event.target.value)}
            maxLength={MAX_USERNAME}
            required
          />
        </label>
        {errors.username && <p className="field-error">{errors.username}</p>}
        {usernameAvailability && (
          <p
            className={
              usernameAvailability.available ? 'helper-text success' : 'helper-text error'
            }
          >
            {usernameAvailability.message ||
              (usernameAvailability.available
                ? 'Username is available.'
                : 'Username is not available.')}
          </p>
        )}
      </section>

      <section>
        <label>
          Bio
          <textarea
            value={draft.bio ?? ''}
            maxLength={MAX_BIO}
            onChange={(event) => handleInputChange('bio', event.target.value)}
            rows={5}
          />
        </label>
        {errors.bio && <p className="field-error">{errors.bio}</p>}
      </section>

      <section>
        <label>
          Avatar image
          <input
            type="file"
            accept={SUPPORTED_AVATAR_TYPES.join(',')}
            onChange={(event) => handleAvatarSelection(event.target.files)}
          />
        </label>
        {errors.avatar && <p className="field-error">{errors.avatar}</p>}
        <p className="helper-text">Max 5 MiB. PNG, JPEG, or WEBP only.</p>
        {draft.avatarUrl && (
          <figure className="profile-page__avatar-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.avatarUrl} alt="Current avatar" />
          </figure>
        )}
      </section>

      <section>
        <label className="profile-page__toggle">
          <input
            type="checkbox"
            checked={draft.disabled ?? false}
            onChange={(event) => handleInputChange('disabled', event.target.checked)}
          />
          Disable public profile visibility
        </label>
      </section>
    </form>
  );
}
