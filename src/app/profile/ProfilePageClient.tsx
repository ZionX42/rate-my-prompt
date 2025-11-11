'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AccountSecuritySettings } from '@/components/profile/AccountSecuritySettings';
import './profile-page.css';

export default function ProfilePageClient() {
  const { loading, profile, accountId, feedback, loadProfile } = useUserProfile();

  const handleRetry = () => {
    void loadProfile();
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
      <ProfileForm />
      <AccountSecuritySettings />
    </div>
  );
}
