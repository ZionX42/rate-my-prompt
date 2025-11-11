import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { appwriteCreateJWT, appwriteCurrentUser, appwriteStorage } from '@/lib/appwrite';
import type { Models } from 'appwrite';

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

type ProfileDraft = Partial<ProfileDocument>;

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

export function useUserProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storage = appwriteStorage();

  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDocument | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loginRedirect = useCallback(() => {
    const nextParam = searchParams?.get('next') ?? '/profile';
    router.replace(`/login?next=${encodeURIComponent(nextParam)}`);
  }, [router, searchParams]);

  const loadProfile = useCallback(async () => {
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
    void loadProfile();
  }, [loadProfile]);

  return {
    jwtToken,
    accountId,
    profile,
    draft,
    setDraft,
    feedback,
    setFeedback,
    loading,
    setLoading,
    loadProfile,
    loginRedirect
  };
}
