import { Suspense } from 'react';
import ProfilePageClient from './ProfilePageClient';

export const metadata = {
  title: 'My Profile',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="profile-page__loading">Loading profile…</div>}>
      <ProfilePageClient />
    </Suspense>
  );
}
