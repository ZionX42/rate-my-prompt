'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfileDashboard from '@/components/users/ProfileDashboard';
import { hasPermission, Permission } from '@/lib/permissions';
import { appwriteCurrentUser, appwriteCreateJWT } from '@/lib/appwrite';
import { Role } from '@/lib/models/user';
import type { PromptModel } from '@/lib/models/prompt';

interface ProfileUser {
  id: string;
  displayName: string;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: Role;
  joinedAt: string;
  updatedAt: string;
}

export default function ProfilePageClient() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [prompts, setPrompts] = useState<PromptModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authCheckCount, setAuthCheckCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication on mount and when auth state might have changed
  useEffect(() => {
    checkAuthAndLoadProfile();
  }, [authCheckCount]);

  // Listen for focus events to re-check auth when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      console.log('ProfilePage: Window focused, re-checking authentication');
      setAuthCheckCount((prev) => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for storage events (in case auth state changes in another tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('session') || e.key?.includes('auth')) {
        console.log('ProfilePage: Storage event detected, re-checking authentication');
        setAuthCheckCount((prev) => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Listen for popstate events (browser back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      console.log('ProfilePage: Navigation detected, re-checking authentication');
      setAuthCheckCount((prev) => prev + 1);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen for successful authentication events
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      console.log('ProfilePage: Auth success event received:', event.detail);
      // Small delay to ensure cookies are set, then re-check auth
      setTimeout(() => {
        console.log('ProfilePage: Re-checking authentication after successful login');
        setAuthCheckCount((prev) => prev + 1);
      }, 500);
    };

    window.addEventListener('auth-success', handleAuthSuccess as EventListener);
    return () => window.removeEventListener('auth-success', handleAuthSuccess as EventListener);
  }, []);

  // Listen for visibility changes (tab switches, minimize/maximize)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('ProfilePage: Page became visible, re-checking authentication');
        setAuthCheckCount((prev) => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check authentication when component mounts or when triggered
  const triggerAuthCheck = () => {
    console.log('ProfilePage: Manual auth check triggered');
    setAuthCheckCount((prev) => prev + 1);
  };

  // Expose trigger function globally for debugging
  useEffect(() => {
    (window as any).triggerProfileAuthCheck = triggerAuthCheck;
    return () => {
      delete (window as any).triggerProfileAuthCheck;
    };
  }, [triggerAuthCheck]);

  const checkAuthAndLoadProfile = async (retryCount = 0) => {
    try {
      console.log('ProfilePage: Checking Appwrite authentication (attempt', retryCount + 1, ')');

      // Check if user is authenticated with Appwrite
      const currentUser = await appwriteCurrentUser();

      if (!currentUser) {
        console.log('ProfilePage: No authenticated user, redirecting to login');
        const nextUrl = searchParams?.get('next') || '/profile';
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      console.log('ProfilePage: User authenticated:', currentUser.email);

      // Add a small delay to ensure session cookies are set
      if (retryCount === 0) {
        console.log('ProfilePage: Waiting for session cookies to be set');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Sync user profile with backend
      console.log('ProfilePage: Attempting to sync user profile');
      const jwt = await appwriteCreateJWT();
      if (!jwt) {
        console.warn('ProfilePage: Unable to obtain Appwrite JWT before sync request');
      }

      const syncResponse = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        credentials: 'include',
      });

      // Log response details for debugging
      console.log(
        'ProfilePage: Sync response headers:',
        Object.fromEntries(syncResponse.headers.entries())
      );

      console.log('ProfilePage: Sync response status:', syncResponse.status);

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json().catch(() => ({}));
        console.error('ProfilePage: Sync failed:', errorData);

        // If it's a "no-session" error and we haven't retried yet, try again
        if (errorData.reason === 'no-session' && retryCount < 2) {
          console.log('ProfilePage: Retrying sync after delay');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return checkAuthAndLoadProfile(retryCount + 1);
        }

        throw new Error(errorData.reason || 'Failed to sync user profile');
      }

      const { user: profile } = await syncResponse.json();
      console.log('ProfilePage: Profile synced:', profile);

      // Load user prompts using API route to avoid server-only imports
      const promptsResponse = await fetch(`/api/users/${profile.id}/prompts?limit=25`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (promptsResponse.ok) {
        const { prompts: userPrompts } = await promptsResponse.json();
        setPrompts(userPrompts || []);
      } else {
        console.warn('ProfilePage: Failed to load user prompts');
        setPrompts([]);
      }

      // Convert to expected format
      const profilePayload: ProfileUser = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        role: profile.role as Role,
        joinedAt: profile.joinedAt,
        updatedAt: profile.updatedAt,
      };

      setUser(profilePayload);
    } catch (err) {
      console.error('ProfilePage: Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    checkAuthAndLoadProfile();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="text-subtext">Loading profile…</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="text-red-600">Error: {error || 'Failed to load profile'}</div>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const serializedPrompts = prompts.map((prompt) => ({
    ...prompt,
    createdAt: prompt.createdAt instanceof Date ? prompt.createdAt.toISOString() : prompt.createdAt,
    updatedAt: prompt.updatedAt instanceof Date ? prompt.updatedAt.toISOString() : prompt.updatedAt,
  }));

  const canEdit = hasPermission(user.role, Permission.EDIT_OWN_PROFILE);

  return <ProfileDashboard user={user} prompts={serializedPrompts} canEdit={canEdit} />;
}
