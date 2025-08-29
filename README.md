# AI Project

## Environment Variables

Ensure you have a `.env` file with required variables. Example:

```env
DATABASE_URL="..."
# Optional: MongoDB for prompt storage
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB="prompt_hub"
```
## Scripts

- `npm test` – run unit tests
- `npm run mongo:setup` – create MongoDB indexes/collections (requires MONGODB_URI)

## Dependencies

This project uses the following key dependencies:
- **Next.js**: React-based framework for building web applications.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Prisma**: ORM for PostgreSQL.
- **MongoDB Node Driver**: MongoDB driver for prompt storage.
- **Jest**: Testing framework with @testing-library/react for React component testing.
- **ESLint & Prettier**: Tools for linting and code formatting.

For a complete list, see [`DEPS.md`](DEPS.md).

## Overview
This project is designed to develop an AI-based solution that addresses specific user needs. The project includes a comprehensive set of documents to guide development, task management, and adherence to best practices.

## Project Structure
The project is organized as follows:

```
ai-project
├── ai
│   ├── PRD.md          # Product Requirements Document
│   ├── TASKS.md        # Task management document
│   └── RULES.md        # Project rules and guidelines
└── README.md           # Project documentation
```

## Contribution
Please follow the guidelines outlined in the `ai/RULES.md` file for coding standards and collaboration protocols.

## API responses and middleware

All API routes use a standardized JSON response contract:

- Success (200/201): Any shape the route defines, e.g. `{ prompt: {...} }`, arrays, etc.
- No content (204): Empty body.
- Errors: Always `{ error: string, details?: any }`.
	- When validation fails with Zod-like errors, `details` is an array of issues and is also mirrored to `issues` for backward compatibility: `{ error: "Validation failed", details: Issue[], issues: Issue[] }`.

Common helpers live in `lib/api/responses.ts`:

- `ok(data)`, `created(data)`, `noContent()`
- `badRequest(message, details?)`, `unauthorized(message, details?)`, `notFound(message, details?)`, `serviceUnavailable(message, details?)`, `internalError(err)`

Middleware helpers in `lib/api/middleware.ts`:

- `requireJson(req)`: For non-GET methods, enforces `Content-Type: application/json`. Returns a 400 response when violated, or `null` to continue. It's tolerant of mocked requests in tests.
- `simpleRateLimit(req, limit, windowMs)`: Very light in-memory rate limiter (per IP). Returns a 400 with `Rate limit exceeded` if threshold is exceeded, otherwise `null`. Replace with a real store in production.

Error body examples:

- 400: `{ "error": "Validation failed", "details": [{ "path": "rating", "message": "Must be <= 5" }], "issues": [...] }`
- 404: `{ "error": "Prompt not found" }`
- 503: `{ "error": "Storage not configured" }`