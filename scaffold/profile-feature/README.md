# Security Notes

1. **Always validate ownership server-side** before mutating profile documents or account data. Treat every client-supplied user ID or JWT as untrusted.
2. **Require re-authentication for sensitive flows** (email changes, password updates, destructive deletions). Verify passwords or short-lived JWTs on the server.
3. **Keep the Appwrite Server SDK and API key on trusted infrastructure only.** Never expose them in client bundles.
4. **Harden avatar uploads** by enforcing MIME/size limits and deleting orphaned files immediately after replacement failures.
5. **Log every GDPR/anonymization action** (who, when, origin IP / UA) and store the logs in an immutable or append-only location.

---

## Overview

This scaffold wires a production-ready user profile management feature powered by Appwrite. It includes:

- A Next.js-ready React component (`ProfilePage.tsx`) that reads and updates profile data, handles username availability checks, avatar uploads, email changes, and account lifecycle actions.
- Server handlers built with the Appwrite Server SDK for updating profiles, changing email addresses, toggling account status, and executing GDPR-compliant deletions/anonymization.
- A database bootstrap script for provisioning the `profiles` collection (and required indexes) via Appwrite APIs.

Use this scaffold as a starting point for integrating Appwrite-based profile management into your Next.js or Node.js project.

## File Map

```
scaffold/profile-feature/
├── ProfilePage.tsx                 # Front-end profile management UI
├── profile-page.css                # (Placeholder) styles referenced by the component
├── api/
│   ├── appwriteClient.ts           # Shared Appwrite client helpers
│   ├── change-email.ts             # POST /api/change-email handler
│   ├── delete-account.ts           # POST /api/delete-account handler
│   ├── disable-account.ts          # POST /api/disable-account handler
│   └── profile.ts                  # PATCH /api/profile handler (multipart)
├── db-setup.ts                     # Idempotent collection/index provisioning script
├── types/
│   ├── formidable.d.ts             # Minimal typings for formidable
│   └── node-appwrite-file.d.ts     # Helper typing for InputFile
└── README.md
```

> **TODO:** Swap `profile-page.css` with your design-system styles or component library. The CSS file is intentionally empty in this scaffold.

## Environment Variables

Set the following secrets (for local dev use `.env.local` / `.env`):

| Variable                                        | Description                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`                 | Appwrite HTTP endpoint (e.g., `https://cloud.appwrite.io/v1`). Used by the browser SDK.               |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID`               | Appwrite project ID, exposed to the client.                                                           |
| `APPWRITE_ENDPOINT`                             | Same as above but used by server handlers.                                                            |
| `APPWRITE_PROJECT_ID`                           | Server-side project ID.                                                                               |
| `APPWRITE_API_KEY`                              | API key with access to the `profiles` collection, storage bucket, and `users` scope. **Keep secret.** |
| `APPWRITE_DATABASE_ID`                          | Database ID containing the `profiles` collection.                                                     |
| `APPWRITE_PROFILES_COLLECTION_ID`               | Collection ID for profile documents (usually matches user IDs).                                       |
| `APPWRITE_AVATAR_BUCKET_ID`                     | Storage bucket ID for avatar uploads (e.g., `avatars`).                                               |
| `APPWRITE_PROMPTS_COLLECTION_ID` _(optional)_   | Set if you want to reassign/delete related prompt documents during GDPR actions.                      |
| `APPWRITE_GDPR_LOGS_COLLECTION_ID` _(optional)_ | Collection for audit logging anonymize/delete events.                                                 |

## Installation & Scripts

Install dependencies (including `formidable` for multipart parsing):

```bash
npm install appwrite node-appwrite formidable
```

> Next.js projects may already include `appwrite`. Ensure the server bundle has `node-appwrite` available.

Run the database setup script after configuring secrets:

```bash
APPWRITE_ENDPOINT=... \
APPWRITE_PROJECT_ID=... \
APPWRITE_API_KEY=... \
APPWRITE_DATABASE_ID=... \
APPWRITE_PROFILES_COLLECTION_ID=profiles \
node scaffold/profile-feature/db-setup.js
```

If you prefer `tsx`/TypeScript execution, use:

```bash
npx tsx scaffold/profile-feature/db-setup.ts
```

> **NOTE:** Adjust collection and bucket IDs to match your Appwrite console configuration.

## Integrating the Frontend

1. Import the component (or migrate pieces into your app router page):

   ```tsx
   import dynamic from 'next/dynamic';

   const ProfilePage = dynamic(() => import('../scaffold/profile-feature/ProfilePage'), {
     ssr: false,
   });
   ```

2. Ensure your Next.js configuration allows client-side Appwrite SDK usage (the component lazy-initialises clients on demand).

3. Provide a username availability endpoint (`POST /api/check-username`) that returns `{ available: boolean, message?: string }`.

4. Wire your authentication middleware to inject `X-Appwrite-UserId` (or similar) headers before requests hit these API routes.

## Server Handler Integration

- **Next.js App Router**: export route handlers from the provided modules. Example for `PATCH /api/profile`:

  ```ts
  import type { NextRequest } from 'next/server';
  import { NextResponse } from 'next/server';
  import { patchProfileHandler, config } from '@/scaffold/profile-feature/api/profile';

  export { config };

  export async function PATCH(request: NextRequest) {
    const { readable, writable } = new TransformStream();
    request.body?.pipeTo(writable);
    const res = new NextResponse(readable);
    await patchProfileHandler(
      request as unknown as IncomingMessage,
      res as unknown as ServerResponse
    );
    return res;
  }
  ```

  > Adjust according to your preferred adapter. For Express/Fastify, simply pass the Node request/response objects.

- **Disable account** (`POST /api/disable-account`): toggles both the profile document and Appwrite user status.
- **Change email**: verifies password server-side via the Users API before calling `users.updateEmail`.
- **Delete account**: handles anonymization or hard deletion, and logs GDPR actions.

Ensure you run these handlers behind authentication middleware that validates Appwrite sessions or your own JWTs, then populate `X-Appwrite-UserId`.

## Avatar Bucket Considerations

- Decide whether avatars are public or private. The scaffold fetches preview URLs via `Storage.getFilePreview` and `Storage.getFileView`. Update this logic if your bucket uses tokenized URLs.
- Consider adding an Appwrite Function/Cloud Task to purge orphaned files if uploads fail halfway through.

## GDPR Workflow Notes

- `delete-account.ts` supports immediate anonymization or deletion. Hook in a job queue if you need grace periods.
- Reassigning prompt ownership is schema-dependent—replace the `ownerId` field updates with whichever fields exist in your project.

## Testing Checklist

- ✅ Fetch existing profile data and render in `ProfilePage`.
- ✅ Username availability debounced check.
- ✅ Avatar upload w/ type + size validation, old file cleanup.
- ✅ Email change flow prompts for password and surfaces verification results.
- ✅ Account disable/anonymize/delete actions with confirmations + feedback.
- ✅ GDPR logs persisted when `APPWRITE_GDPR_LOGS_COLLECTION_ID` is configured.

## Deployment Tips

- Use environment-specific Appwrite API keys with minimum scopes (profiles collection, avatars bucket, users.write, databases.write).
- When deploying to Vercel/Netlify, run `npx tsx scaffold/profile-feature/db-setup.ts` as part of an admin/maintenance step, not every deploy.
- Consider wrapping the API handlers with rate-limiting middleware to deter brute-force username or email change attempts.
