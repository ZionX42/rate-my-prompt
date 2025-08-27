# PostgreSQL Database Schema for Users

This document provides an overview of the PostgreSQL database schema for user management in Prompt Hub.

## Overview

The user management system is built using PostgreSQL and Prisma ORM. The schema includes tables for:

- Users (basic profile information)
- Accounts (OAuth connections)
- Sessions (user login sessions)
- Verification tokens (for email verification)

## Database Schema

The main tables and their relationships are:

### Users

The `User` table stores the core user information:

- `id`: Unique identifier (CUID)
- `name`: User's display name
- `email`: User's unique email address
- `emailVerified`: Timestamp of when the email was verified
- `image`: Avatar image URL
- `password`: Hashed password for local authentication
- `role`: User role (USER, ADMIN, or MODERATOR)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Accounts

The `Account` table stores OAuth provider connections:

- `id`: Unique identifier (CUID)
- `userId`: Reference to the User
- `type`: Type of account (e.g., "oauth")
- `provider`: OAuth provider (e.g., "google", "github")
- `providerAccountId`: ID from the OAuth provider
- Various token fields for OAuth authentication

### Sessions

The `Session` table tracks user login sessions:

- `id`: Unique identifier (CUID)
- `userId`: Reference to the User
- `sessionToken`: Unique session token
- `expires`: Session expiration timestamp

### Verification Tokens

The `VerificationToken` table manages email verification:

- `identifier`: Usually the user's email
- `token`: Unique verification token
- `expires`: Token expiration timestamp

## Entity-Relationship Diagram

```
┌────────────┐       ┌────────────┐
│   User     │       │  Account   │
├────────────┤       ├────────────┤
│ id         │       │ id         │
│ name       │       │ userId     │◄─────┐
│ email      │       │ provider   │      │
│ password   │       │ tokens     │      │
│ role       │       └────────────┘      │
└────────────┘              ▲            │
      ▲                     │            │
      │                     │            │
      │                     │            │
      │                     │            │
      │      ┌──────────────┴────┐       │
      └──────┤   Session         ├───────┘
             ├───────────────────┤
             │ id                │
             │ userId            │
             │ sessionToken      │
             │ expires           │
             └───────────────────┘
```

## Usage with Prisma

Here are examples of common operations:

### Find a user by email

```typescript
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" }
});
```

### Create a new user

```typescript
const newUser = await prisma.user.create({
  data: {
    name: "John Doe",
    email: "john@example.com",
    role: "USER"
  }
});
```

### Get a user with their accounts

```typescript
const userWithAccounts = await prisma.user.findUnique({
  where: { id: userId },
  include: { accounts: true }
});
```

## Setup Instructions

1. Ensure PostgreSQL is installed and running
2. Configure the database connection in `.env` file
3. Run `npx prisma migrate dev` to apply migrations

## Testing the Schema

You can run the provided tests to verify the schema structure:

```bash
npm test -- __tests__/database/schema.test.ts
```

This will validate that the Prisma client has the correct model structure.
