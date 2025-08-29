import React from 'react';
import Image from 'next/image';

// User profile page template
// Verification: navigating to /users/[id] renders this layout.
// Data fetching is deferred to future tasks; this template displays placeholders.
export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Future: fetch user via Prisma when auth/session is wired (2.2.3), e.g. prisma.user.findUnique({ where: { id } })
  // For now, show a presentational shell so routes and layout are verified.
  const displayName = `User ${id.slice(0, 6)}`;

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="card p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-muted">
            {/* Placeholder avatar; to be replaced with user.image */}
            <Image
              src="/avatar-placeholder.png"
              alt="User avatar"
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-heading">{displayName}</h1>
            <p className="text-subtext mt-1">@{id}</p>

            <div className="mt-4 space-y-2">
              {/* Bio placeholder; to be editable in 4.1.2 */}
              <p className="text-body">This is the user bio. Tell the world about yourself.</p>
              <div className="flex flex-wrap gap-4 text-sm text-subtext">
                <span>Joined recently</span>
                <span>Reputation: —</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        {/* Tabs placeholder for future subsections: Prompts, Activity, About */}
        <nav className="border-b border-border mb-4">
          <ul className="flex gap-6 text-sm">
            <li className="pb-3 border-b-2 border-accent-blue text-heading">Prompts</li>
            <li className="pb-3 text-subtext">Activity</li>
            <li className="pb-3 text-subtext">About</li>
          </ul>
        </nav>

        <div className="text-subtext">
          Prompts by this user will appear here.
        </div>
      </section>
    </main>
  );
}
