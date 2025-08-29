# Project Dependencies

## Frameworks & Libraries
- **Next.js**: React-based framework for building web applications.
- **React**: JavaScript library for building user interfaces.
- **TypeScript**: Typed superset of JavaScript for safer development.

## Styling
- **Tailwind CSS**: Utility-first CSS framework for styling.

## Testing
- **Jest**: JavaScript testing framework.
- **@testing-library/react**: Utilities for testing React components.
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing.
- **undici**: Fetch API polyfill for Node.js.

## Databases
- **Prisma**: ORM for PostgreSQL.
- **@prisma/client**: Prisma client for database interactions.
- **MongoDB Node Driver**: MongoDB driver for prompt storage.

## Linting & Formatting
- **ESLint**: JavaScript linter.
- **Prettier**: Code formatter.

## CI/CD
- **GitHub Actions**: Workflow automation for CI/CD.

## Other Utilities
- **TextEncoder/TextDecoder**: Polyfills for Node.js (via `node:util`).
- **Web Streams**: Polyfills for Node.js (via `node:stream/web`).

## How to Verify Dependencies
Run the following commands:
```bash
npm pkg get dependencies devDependencies
npm ls next react typescript tailwindcss jest @testing-library/react undici prisma @prisma/client mongodb eslint prettier
```

## Notes
- Dependencies are managed via `package.json`.
- Tailwind CSS configuration is in `tailwind.config.js`.
- Prisma schema is defined in `prisma/schema.prisma`.
