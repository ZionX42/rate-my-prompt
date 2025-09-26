# Appwrite Authentication & Modal UX

The app now relies entirely on Appwrite sessions surfaced through a global auth modal. Email/password flows, OAuth hand-offs, and server authorization all interact with Appwrite—no local password store remains in the Next.js app.

## Environment variables

Add these to `.env.local` (never commit):

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

Optional server credentials for future queues / background jobs:

```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_server_api_key   # never expose publicly
```

When either public variable is missing, the UI disables auth actions and the API routes return `503 config-missing`. The helper `missingAppwriteEnvVars()` (in `lib/appwrite.ts`) exposes the exact keys so we can surface a precise diagnostic banner.

## Runtime architecture

| File / module                                | Responsibility                                                                                                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/useAppwriteAuth.ts`                   | Centralized auth state machine (ready → loading → authenticated/unauthenticated), wraps the Appwrite JavaScript SDK, syncs profiles, and exposes `signup`, `login`, `logout`, `refresh`, and `clearError`. |
| `components/auth/AuthModalProvider.tsx`      | Global context + portal that renders the modal shell, swaps between login/signup, and auto-opens when routed to `/login` or `/signup`.                                                                     |
| `components/auth/AuthForm.tsx`               | Form UI for email flows, OAuth buttons, readiness diagnostics, and success hand-off back to the modal provider.                                                                                            |
| `components/auth/UserMenu.tsx`               | Avatar dropdown for authenticated users with logout and profile affordances.                                                                                                                               |
| `app/login/page.tsx` & `app/signup/page.tsx` | Fallback pages that immediately trigger the modal (keeps deep-links working) while still rendering the form for no-JS scenarios.                                                                           |
| `app/api/auth/verify/route.ts`               | Server-to-server verification endpoint; fetches the current Appwrite session using forwarded cookies and returns `{ authenticated, role }`.                                                                |
| `app/api/auth/sync/route.ts`                 | Backfill hook run after every successful login; stores a user profile keyed by the Appwrite account ID in our Appwrite database.                                                                           |
| `lib/auth.ts`                                | Server helpers (`getCurrentUser`, `isCurrentUserAdmin`, `currentUserHasPermission`) that reuse the Appwrite session cookie inside API routes, middleware, and RSC loaders.                                 |
| `middleware.ts`                              | Applies CSP headers and calls `GET /api/auth/verify` for hardened routes (admin dashboards, etc.).                                                                                                         |

## Client flow walk-through

1. **Readiness check** – `useAppwriteAuth` exposes `ready` and `missingEnv`. `AuthForm` blocks submission and shows a configuration warning if any required variable is missing.
2. **Email/password** – `AuthForm` calls `account.createEmailPasswordSession`, refreshes local state via `refresh()`, then POSTs to `/api/auth/sync` so the Appwrite database has a matching profile document (`documentId` equals the Appwrite account `$id`).
3. **OAuth** – Buttons call `account.createOAuth2Session` and rely on Appwrite to redirect back to the app; once the browser returns, the hook’s lazy refresh loads the session and triggers the same sync.
4. **Modal control** – Any component can call `const { open, close } = useAuthModal();` to toggle the overlay. The provider remembers the last requested mode (`login` or `signup`).
5. **Navigation** – `components/Navigation.tsx` loads auth state via `useAppwriteAuth(true)` and chooses between “Log in / Sign up” buttons (that open the modal) or `UserMenu`.

```tsx
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export function CtaButton() {
  const { open } = useAuthModal();
  return (
    <button type="button" onClick={() => open('signup')}>
      Join Prompt Hub
    </button>
  );
}
```

## Server-side integration

- `getCurrentUser(request)` reads the Appwrite session cookie (`a_session_{projectId}`), calls the Appwrite REST API, and hydrates an internal user profile. If a profile document already exists (created by `/api/auth/sync`), we reuse its role and metadata; otherwise a transient user object is returned.
- `isCurrentUserAdmin` / `currentUserHasPermission` provide simple role enforcement for API routes, edge middleware, and React Server Components.
- `/api/auth/verify` is used by middleware to gate admin pages without duplicating Appwrite SDK logic in middleware (edge runtimes cannot bundle the SDK easily).
- `/api/auth/sync` ensures every Appwrite account has a corresponding document in the `users` collection. We now persist the document **with the same ID** as the account so `getUserById(account.$id)` works reliably on future requests.

## OAuth notes

1. Enable providers in the Appwrite console (`Auth → Providers`).
2. Add callback URLs for local and production (e.g. `http://localhost:3000` and `https://prompt-hub.app`).
3. Use the helper in `AuthForm` as a reference for calling `account.createOAuth2Session({ provider, success, failure })`.
4. After redirect, the session cookie is set automatically and `useAppwriteAuth` calls `refresh()` on mount to pick it up.

## Manual Appwrite setup checklist

1. Create a Cloud project and add a **Web** platform for your local/prod origins.
2. Copy the endpoint + project ID into `.env.local`.
3. Run `npm run appwrite:setup` once to provision collections/attributes (idempotent).
4. Optionally mint an API key (scopes: `users.read`, `users.write`) for future background jobs; store it without the `NEXT_PUBLIC_` prefix.
5. Test locally by visiting `/login`, submitting the form, and confirming a new document appears in the `users` collection with the Appwrite account ID.

## Troubleshooting

| Symptom                               | Likely cause                                | Fix                                                                                                          |
| ------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| “Auth temporarily unavailable” banner | Required env vars missing                   | Populate `.env.local`, restart dev server                                                                    |
| Repeated “Sync failed” toast          | Appwrite REST call rejected                 | Inspect network tab for `/api/auth/sync`; verify Appwrite cookies are present and Web platform is configured |
| OAuth loop                            | Callback/allowed URLs mismatch              | Update provider settings in Appwrite console                                                                 |
| Admin API returns 401                 | `/api/auth/verify` could not find a session | Ensure frontend login happened and cookies are forwarded when making server-side requests                    |

## Next steps

- Remove legacy `/api/auth` password endpoints once any remaining consumers migrate.
- Extend `/api/auth/sync` to enrich profiles with Appwrite preferences (avatar, labels) if needed.
- Consider adding rate limiting around auth routes to harden against brute-force attempts.
