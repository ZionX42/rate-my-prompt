# AI Project

An AI-based solution designed to address specific user needs, built with Next.js, Tailwind CSS, and Appwrite.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Scripts](#scripts)
- [Testing](#testing)
- [Dependencies](#dependencies)
- [Contribution](#contribution)

## Scripts

- `npm test` – run unit tests
- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run appwrite:setup` – create Appwrite collections and indexes

## Testing

This project uses [Jest](https://jestjs.io/) for unit and integration testing and [Cypress](https://www.cypress.io/) for end-to-end testing.

### Running Tests

- **Run all tests with coverage:**
  ```bash
  npm test
  ```
- **Run tests in watch mode:**
  ```bash
  npm run test:watch
  ```
- **Run Cypress E2E tests:**
  ```bash
  npm run cypress:run
  ```

### Coverage

Test coverage is automatically generated in the `coverage/` directory after running `npm test`. The CI/CD pipeline will also upload coverage reports to [Codecov](https://about.codecov.io/) for visualization and tracking.

## Dependencies

This project uses the following key dependencies:

- **Next.js**: React-based framework for building web applications.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Appwrite**: Backend-as-a-Service for database, authentication, and storage.
- **Prisma**: ORM for PostgreSQL.
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
