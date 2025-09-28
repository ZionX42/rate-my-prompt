'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProfileEditForm from '@/components/users/ProfileEditForm';
import UserPrompts from '@/components/users/UserPrompts';
import type { Role } from '@/lib/models/user';
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

interface SerializablePrompt extends Omit<PromptModel, 'createdAt' | 'updatedAt'> {
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ProfileDashboardProps {
  user: ProfileUser;
  prompts: SerializablePrompt[];
  canEdit: boolean;
}

const ROLE_STYLES: Record<
  Role,
  {
    label: string;
    badgeClass: string;
  }
> = {
  USER: {
    label: 'Member',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  },
  MODERATOR: {
    label: 'Moderator',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
  },
  ADMIN: {
    label: 'Administrator',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProfileDashboard({ user, prompts, canEdit }: ProfileDashboardProps) {
  const [profile, setProfile] = useState(profileFromProps(user));

  const promptStats = useMemo(() => {
    const total = prompts?.length ?? 0;
    const published = prompts?.filter((prompt) => prompt.isPublished).length ?? 0;
    return {
      total,
      published,
      drafts: Math.max(total - published, 0),
    };
  }, [prompts]);

  const roleDisplay = ROLE_STYLES[profile.role] ?? ROLE_STYLES.USER;

  const latestPrompts = useMemo(() => prompts?.slice(0, 10) ?? [], [prompts]);

  return (
    <main className="container mx-auto px-4 py-10 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="card p-6 flex flex-col gap-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
              <Image
                src={profile.avatarUrl || '/avatar-placeholder.png'}
                alt={`${profile.displayName}'s avatar`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-heading">{profile.displayName}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${roleDisplay.badgeClass}`}
                >
                  {roleDisplay.label}
                </span>
              </div>
              <p className="text-sm text-subtext">Member since {formatDate(profile.joinedAt)}</p>
              {profile.bio ? (
                <p className="max-w-2xl text-sm text-body">{profile.bio}</p>
              ) : (
                <p className="text-sm text-subtext italic">
                  Share a little about yourself to let the community know who you are.
                </p>
              )}
            </div>
          </header>

          <div>
            <ProfileEditForm
              userId={profile.id}
              initialData={{
                displayName: profile.displayName,
                bio: profile.bio ?? '',
                avatarUrl: profile.avatarUrl ?? '',
              }}
              canEdit={canEdit}
              onProfileUpdated={(payload) =>
                setProfile((prev) => ({
                  ...prev,
                  displayName: payload.displayName ?? prev.displayName,
                  bio: payload.bio ?? prev.bio,
                  avatarUrl: payload.avatarUrl ?? prev.avatarUrl,
                  updatedAt: payload.updatedAt ?? prev.updatedAt,
                }))
              }
            />
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card space-y-4 p-6">
            <h2 className="text-lg font-semibold text-heading">Account Overview</h2>
            <dl className="space-y-3 text-sm text-subtext">
              <div className="flex items-center justify-between">
                <dt>Email</dt>
                <dd className="text-right font-medium text-heading">
                  {profile.email || 'Not provided'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Role</dt>
                <dd className="text-right font-medium text-heading">{roleDisplay.label}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Last updated</dt>
                <dd className="text-right font-medium text-heading">
                  {formatDate(profile.updatedAt)}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2 text-sm text-subtext opacity-70"
            >
              Account security (coming soon)
            </button>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-heading">Prompt Summary</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <Stat label="Total prompts" value={promptStats.total} />
              <Stat label="Published" value={promptStats.published} />
              <Stat label="Drafts" value={promptStats.drafts} />
            </div>
            <Link
              href="/prompts/new"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
            >
              Create new prompt
            </Link>
          </div>
        </aside>
      </div>

      <section className="card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-heading">Your prompts</h2>
          <span className="text-sm text-subtext">
            Showing latest {latestPrompts.length} prompts
          </span>
        </div>
        <UserPrompts prompts={latestPrompts} />
      </section>
    </main>
  );
}

function profileFromProps(user: ProfileUser) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    joinedAt: user.joinedAt,
    updatedAt: user.updatedAt,
  } satisfies ProfileUser;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
      <span className="text-subtext">{label}</span>
      <span className="text-heading font-semibold">{value}</span>
    </div>
  );
}
