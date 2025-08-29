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