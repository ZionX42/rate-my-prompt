import { useEffect, useMemo, useRef, useState } from 'react';
import { Account, Client, Storage } from 'appwrite';

// TODO: Replace with your project-specific UI primitives / styling system
import './profile-page.css';

// Utility types --------------------------------------------------------------
interface ProfileDocument {
  userId: string;
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

interface ApiError {
  error: string;
  reason?: string;
  fields?: Record<string, string>;
}

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

type AccountAction = 'disable' | 'anonymize' | 'delete';

// Environment helpers -------------------------------------------------------
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

function assertAppwriteEnv() {
  if (!endpoint || !projectId) {
    throw new Error(
      'Appwrite env vars missing. Please set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.'
    );
  }
}

function buildAccount(): Account {
  assertAppwriteEnv();
  const client = new Client().setEndpoint(endpoint!).setProject(projectId!);
  return new Account(client);
}

function buildStorage(): Storage {
  assertAppwriteEnv();
  const client = new Client().setEndpoint(endpoint!).setProject(projectId!);
  return new Storage(client);
}

// Validators ----------------------------------------------------------------
const MAX_DISPLAY_NAME = 120;
const MAX_USERNAME = 64;
const MAX_BIO = 1024;
const SUPPORTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MiB

function validateProfileInput(
  draft: Partial<ProfileDocument>,
  file: File | null
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (draft.displayName && draft.displayName.length > MAX_DISPLAY_NAME) {
    errors.displayName = `Display name must be 0${MAX_DISPLAY_NAME} characters.`;
  }

  if (draft.username && draft.username.length > MAX_USERNAME) {
    errors.username = `Username must be 0${MAX_USERNAME} characters.`;
  }

  if (draft.bio && draft.bio.length > MAX_BIO) {
    errors.bio = `Bio must be 0${MAX_BIO} characters.`;
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

// Component -----------------------------------------------------------------
export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileDocument | null>(null);
  const [draft, setDraft] = useState<Partial<ProfileDocument>>({});
  const [usernameAvailability, setUsernameAvailability] = useState<UsernameCheckResponse | null>(
    null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [accountAction, setAccountAction] = useState<AccountAction | null>(null);
  const [accountConfirm, setAccountConfirm] = useState(false);
  const [disableTargetState, setDisableTargetState] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const account = useMemo(() => buildAccount(), []);
  const storage = useMemo(() => buildStorage(), []);
  const usernameDebounceRef = useRef<number | null>(null);

  // Load profile -------------------------------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const session = await account.get();
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as ApiError;
          throw new Error(payload.reason || payload.error || 'Failed to load profile');
        }

        const payload = (await response.json()) as ApiSuccess<ProfileDocument>;
        setProfile(payload.data);
        setDraft(payload.data);

        if (!payload.data.avatarUrl && payload.data.avatarFileId) {
          // Optional: resolve signed URL for private file
          try {
            const fileUrl = storage.getFilePreview('avatars', payload.data.avatarFileId);
            setDraft((prev) => ({ ...prev, avatarUrl: fileUrl.toString() }));
          } catch (err) {
            console.warn('Failed to resolve avatar preview', err);
          }
        }

        setFeedback(null);
        console.info('Profile loaded for user', session.$id);
      } catch (error) {
        console.error('Profile load failed', error);
        setFeedback(error instanceof Error ? error.message : 'Unable to load profile.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile().catch(console.error);
  }, [account, storage]);

  // Username availability check ---------------------------------------------
  useEffect(() => {
    if (!draft.username || draft.username === profile?.username) {
      setUsernameAvailability(null);
      return;
    }

    if (usernameDebounceRef.current) {
      window.clearTimeout(usernameDebounceRef.current);
    }

    usernameDebounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/check-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: draft.username }),
        });

        const payload = (await res.json()) as UsernameCheckResponse & ApiError;
        setUsernameAvailability({
          available: res.ok ? payload.available : false,
          message: payload.message ?? payload.reason ?? payload.error,
        });
      } catch (error) {
        console.error('Username availability check failed', error);
        setUsernameAvailability({ available: false, message: 'Unable to check username.' });
      }
    }, 250);

    return () => {
      if (usernameDebounceRef.current) {
        window.clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [draft.username, profile?.username]);

  // Handlers -----------------------------------------------------------------
  const handleInputChange = (field: keyof ProfileDocument, value: string | boolean) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelection = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;
    setAvatarFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validationErrors = validateProfileInput(draft, avatarFile);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const formData = new FormData();
    if (draft.displayName !== undefined) formData.append('displayName', draft.displayName);
    if (draft.username !== undefined) formData.append('username', draft.username);
    if (draft.bio !== undefined) formData.append('bio', draft.bio);
    if (typeof draft.disabled === 'boolean') {
      formData.append('disabled', String(draft.disabled));
    }
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      setIsSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<
        ApiError & ApiSuccess<ProfileDocument>
      >;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.reason || payload.error || 'Profile update failed');
      }

      setProfile(payload.data as ProfileDocument);
      setDraft(payload.data as ProfileDocument);
      setAvatarFile(null);
      setFeedback('Profile updated successfully.');
    } catch (error) {
      console.error('Profile update failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
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

    try {
      const response = await fetch('/api/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(emailForm),
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<ApiError>;
      if (!response.ok) {
        throw new Error(payload.reason || payload.error || 'Email change failed');
      }

      setFeedback('Email change requested. Please check your inbox for verification.');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Email change failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to change email.');
    }
  };

  const handleAccountAction = async () => {
    if (!accountAction || !accountConfirm) return;

    try {
      let response: Response;
      if (accountAction === 'disable') {
        response = await fetch('/api/disable-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ disabled: disableTargetState }),
        });
      } else {
        response = await fetch('/api/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mode: accountAction,
            confirmation: true,
          }),
        });
      }

      const payload = (await response.json().catch(() => ({}))) as Partial<ApiError> & {
        disabled?: boolean;
      };
      if (!response.ok) {
        throw new Error(payload.reason || payload.error || 'Account action failed');
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
          : 'Account action completed. You may be signed out shortly.'
      );
      setAccountAction(null);
      setAccountConfirm(false);
    } catch (error) {
      console.error('Account action failed', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to process account action.');
    }
  };

  if (isLoading) {
    return <div className="profile-page__loading">Loading profile…</div>;
  }

  if (!profile) {
    return (
      <div className="profile-page__error">
        <p>We could not load your profile.</p>
        {feedback && <p className="profile-page__feedback">{feedback}</p>}
        <button type="button" onClick={() => window.location.reload()}>
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
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
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
                  ? 'Username is available'
                  : 'Username is not available')}
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

// Optional helper stylesheet -------------------------------------------------
// This component assumes a lightweight CSS file (profile-page.css) to provide
// basic layout. Replace or integrate with your design system as needed.
