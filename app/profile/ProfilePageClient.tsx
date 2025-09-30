'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { appwriteCreateJWT, appwriteCurrentUser, appwriteStorage } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import './profile-page.css';

interface ProfileDocument extends Models.Document {
  userId: string | null;
  username: string;
  displayName: string;
  bio?: string;
  avatarFileId?: string;
  avatarUrl?: string;
  disabled?: boolean;
  privacyConsent?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

interface ApiErrorPayload {
  error?: string;
  reason?: string;
  message?: string;
  fields?: Record<string, string>;
  status?: number;
}

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

type AccountAction = 'disable' | 'anonymize' | 'delete';

type ProfileDraft = Partial<ProfileDocument>;

type FormErrors = Record<string, string>;

const MAX_DISPLAY_NAME = 120;
const MAX_USERNAME = 64;
const MAX_BIO = 1024;
const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MiB
const AVATAR_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_AVATAR_BUCKET_ID || 'avatars';

function buildAuthHeaders(jwt: string) {
  return {
    Authorization: `Bearer ${jwt}`,
    'X-Appwrite-JWT': jwt,
  } as const;
}

function resolveErrorMessage(payload: ApiErrorPayload, fallback: string) {
  return payload.reason ?? payload.message ?? payload.error ?? fallback;
}

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

export default function ProfilePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storage = useMemo(() => appwriteStorage(), []);

  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDocument | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameCheckResponse | null>(
    null
  );
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [accountAction, setAccountAction] = useState<AccountAction | null>(null);
  const [accountConfirm, setAccountConfirm] = useState(false);
  const [disableTargetState, setDisableTargetState] = useState(false);

  const usernameDebounceRef = useRef<number | null>(null);

  const loginRedirect = useCallback(() => {
    const nextParam = searchParams?.get('next') ?? '/profile';
    router.replace(`/login?next=${encodeURIComponent(nextParam)}`);
  }, [router, searchParams]);

  const ensureProfileLoaded = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback(null);

      const currentAccount = await appwriteCurrentUser();
      if (!currentAccount) {
        loginRedirect();
        return;
      }

      setAccountId(currentAccount.$id);

      const jwt = await appwriteCreateJWT();
      if (!jwt) {
        throw new Error(
          'Unable to obtain Appwrite session token. Please sign out and sign in again.'
        );
      }

      setJwtToken(jwt);

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: buildAuthHeaders(jwt),
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        loginRedirect();
        return;
      }

      const payload = (await response.json()) as ApiSuccess<ProfileDocument> | ApiErrorPayload;
      if (!response.ok) {
        const reason = resolveErrorMessage(payload as ApiErrorPayload, 'Failed to load profile');
        throw new Error(reason);
      }

      if (!('ok' in payload)) {
        const reason = resolveErrorMessage(payload as ApiErrorPayload, 'Failed to load profile');
        throw new Error(reason);
      }

      const profileData = payload.data;
      setProfile(profileData);
      setDraft(profileData);

      if (!profileData.avatarUrl && profileData.avatarFileId) {
        try {
          const preview = storage.getFilePreview(AVATAR_BUCKET_ID, profileData.avatarFileId);
          setDraft((prev) => ({ ...prev, avatarUrl: preview.toString() }));
        } catch (err) {
          console.warn('Failed to resolve avatar preview', err);
        }
      }
    } catch (error) {
      console.error('Profile load failed', error);
      setFeedback(error instanceof Error ? error.message : 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, [loginRedirect, storage]);

  useEffect(() => {
    void ensureProfileLoaded();
  }, [ensureProfileLoaded]);

  useEffect(() => {
    if (!draft.username || !jwtToken) {
      setUsernameAvailability(null);
      return;
    }

    if (draft.username === profile?.username) {
      setUsernameAvailability(null);
      return;
    }

    if (usernameDebounceRef.current) {
      window.clearTimeout(usernameDebounceRef.current);
      usernameDebounceRef.current = null;
    }

    usernameDebounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/check-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(jwtToken),
          },
          body: JSON.stringify({ username: draft.username }),
        });

        const payload = (await response.json()) as UsernameCheckResponse & ApiErrorPayload;
        const available = response.ok ? payload.available : false;
        const message = payload.message ?? payload.reason ?? payload.error;
        setUsernameAvailability({ available, message });
      } catch (error) {
        console.error('Username availability check failed', error);
        setUsernameAvailability({ available: false, message: 'Unable to check username.' });
      }
    }, 300);

    return () => {
      if (usernameDebounceRef.current) {
        window.clearTimeout(usernameDebounceRef.current);
        usernameDebounceRef.current = null;
      }
    };
  }, [draft.username, jwtToken, profile?.username]);

  const handleAvatarSelection = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    setAvatarFile(file);
  };

  const handleInputChange = <K extends keyof ProfileDocument>(
    field: K,
    value: ProfileDocument[K]
  ) => {
    let nextValue: ProfileDocument[K] = value;

    if (field === 'username' && typeof value === 'string') {
      nextValue = value.trim().toLowerCase() as ProfileDocument[K];
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
        headers: buildAuthHeaders(jwtToken),
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        loginRedirect();
        return;
      }

      const payload = (await response.json()) as ApiSuccess<ProfileDocument> | ApiErrorPayload;
      if (!response.ok) {
        const reason = resolveErrorMessage(payload as ApiErrorPayload, 'Profile update failed.');
        throw new Error(reason);
      }

      if (!('ok' in payload)) {
        const reason = resolveErrorMessage(payload as ApiErrorPayload, 'Profile update failed.');
        throw new Error(reason);
      }

      const updated = payload.data;
      setProfile(updated);
      setDraft(updated);
      setAvatarFile(null);
      setFeedback('Profile updated successfully.');
    } catch (error) {
      console.error('Profile update failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const openEmailModal = () => {
    setEmailForm({
      newEmail: profile?.username ? `${profile.username}@example.com` : '',
      password: '',
    });
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!jwtToken) {
      setFeedback('Authentication expired. Please refresh the page.');
      return;
    }

    try {
      const response = await fetch('/api/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(jwtToken),
        },
        credentials: 'include',
        body: JSON.stringify(emailForm),
      });

      const payload = (await response.json()) as ApiErrorPayload & {
        ok?: boolean;
        message?: string;
        requiresVerification?: boolean;
      };

      if (!response.ok || !payload.ok) {
        const reason = payload.reason || payload.error || payload.message;
        throw new Error(reason || 'Email change failed');
      }

      setFeedback(
        payload.requiresVerification
          ? 'Verification email sent to the new address.'
          : 'Email updated successfully.'
      );
      setShowEmailModal(false);
    } catch (error) {
      console.error('Email change failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to change email.');
    }
  };

  const handleAccountAction = async () => {
    if (!accountAction || !accountConfirm || !jwtToken) {
      return;
    }

    try {
      let response: Response;

      if (accountAction === 'disable') {
        response = await fetch('/api/disable-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(jwtToken),
          },
          credentials: 'include',
          body: JSON.stringify({ disabled: disableTargetState }),
        });
      } else {
        response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildAuthHeaders(jwtToken),
          },
          credentials: 'include',
          body: JSON.stringify({
            mode: accountAction,
            confirmation: true,
          }),
        });
      }

      if (response.status === 401 || response.status === 403) {
        loginRedirect();
        return;
      }

      const payload = (await response.json()) as ApiErrorPayload & { disabled?: boolean };
      if (!response.ok) {
        const reason = payload.reason || payload.error || payload.message;
        throw new Error(reason || 'Account action failed');
      }

      if (accountAction === 'disable' && typeof payload.disabled === 'boolean') {
        setProfile((prev) => (prev ? { ...prev, disabled: payload.disabled } : prev));
        setDraft((prev) => ({ ...prev, disabled: payload.disabled }));
      }

      setFeedback(
        accountAction === 'disable'
          ? disableTargetState
            ? 'Account disabled. Contact support to re-enable.'
            : 'Account re-enabled.'
          : accountAction === 'anonymize'
            ? 'Account anonymized. Some features may no longer be available.'
            : 'Account scheduled for deletion. You will be signed out shortly.'
      );
      setAccountAction(null);
      setAccountConfirm(false);
    } catch (error) {
      console.error('Account action failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to process account action.');
    }
  };

  const handleRetry = () => {
    void ensureProfileLoaded();
  };

  if (loading) {
    return <div className="profile-page__loading">Loading profile…</div>;
  }

  if (!profile || !accountId) {
    return (
      <div className="profile-page__error">
        <p>We could not load your profile.</p>
        {feedback && <p className="profile-page__feedback">{feedback}</p>}
        <button type="button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {feedback && <div className="profile-page__feedback">{feedback}</div>}

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

      <section className="profile-page__secondary">
        <header>
          <h2>Account security</h2>
          <p>Sensitive changes require re-authentication.</p>
        </header>
        <div className="profile-page__actions">
          <button type="button" onClick={openEmailModal}>
            Change email
          </button>
          <button
            type="button"
            onClick={() => {
              setDisableTargetState(!(profile?.disabled ?? false));
              setAccountAction('disable');
            }}
          >
            {profile?.disabled ? 'Re-enable account' : 'Disable account'}
          </button>
          <button type="button" onClick={() => setAccountAction('anonymize')}>
            Anonymize account (GDPR)
          </button>
          <button type="button" className="danger" onClick={() => setAccountAction('delete')}>
            Delete account
          </button>
        </div>
      </section>

      {showEmailModal && (
        <dialog className="profile-page__modal" open>
          <form onSubmit={handleEmailSubmit} method="dialog">
            <h3>Change email address</h3>
            <p>Please confirm your current password to continue.</p>
            <label>
              New email
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={(event) => setEmailForm({ ...emailForm, newEmail: event.target.value })}
                required
              />
            </label>
            <label>
              Current password
              <input
                type="password"
                value={emailForm.password}
                onChange={(event) => setEmailForm({ ...emailForm, password: event.target.value })}
                required
              />
            </label>
            <footer>
              <button type="button" onClick={() => setShowEmailModal(false)}>
                Cancel
              </button>
              <button type="submit">Submit</button>
            </footer>
          </form>
        </dialog>
      )}

      {accountAction && (
        <dialog className="profile-page__modal" open>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleAccountAction();
            }}
            method="dialog"
          >
            <h3>
              {accountAction === 'disable'
                ? profile?.disabled
                  ? 'Re-enable account'
                  : 'Disable account'
                : accountAction === 'anonymize'
                  ? 'Anonymize account'
                  : 'Delete account'}
            </h3>
            <p>
              {accountAction === 'disable'
                ? disableTargetState
                  ? 'Your profile and logins will be disabled until you contact support to re-enable.'
                  : 'Your account will be restored and logins re-enabled.'
                : accountAction === 'anonymize'
                  ? 'Personal data will be removed. This action is irreversible.'
                  : 'Your account and profile will be permanently deleted. This action cannot be undone.'}
            </p>
            <label className="profile-page__toggle">
              <input
                type="checkbox"
                checked={accountConfirm}
                onChange={(event) => setAccountConfirm(event.target.checked)}
              />
              I understand the consequences and wish to proceed.
            </label>
            <footer>
              <button type="button" onClick={() => setAccountAction(null)}>
                Cancel
              </button>
              <button type="submit" className="danger" disabled={!accountConfirm}>
                Confirm
              </button>
            </footer>
          </form>
        </dialog>
      )}
    </div>
  );
}
