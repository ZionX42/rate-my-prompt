# MongoDB to Appwrite Migration

This document outlines the complete migration from MongoDB to Appwrite for the prompt-hub project.

## Migration Summary

The project has been successfully migrated from using MongoDB as the document database to using Appwrite. This migration affects:

- **Prompts**: Main content storage with search and categorization
- **Comments**: Threaded comment system with soft delete
- **Ratings**: User rating system with statistics

PostgreSQL with Prisma is still used for user management and authentication.

## What Changed

### 1. Database Layer
- **Removed**: `lib/mongo/` directory (moved to `lib/mongodb/` for backup)
- **Added**: `lib/appwrite/` directory with new client and collections configuration

### 2. Repository Layer
- **Migrated**: All repository files replaced with Appwrite equivalents
  - `lib/repos/promptRepo.ts` (MongoDB → Appwrite)
  - `lib/repos/commentRepo.ts` (MongoDB → Appwrite)  
  - `lib/repos/ratingRepo.ts` (MongoDB → Appwrite)
- **Backup**: Original MongoDB repositories saved as `*.mongodb.ts` files

### 3. API Routes
Updated all API routes to check for Appwrite configuration instead of MongoDB:
- Changed `process.env.MONGODB_URI` checks to `process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY`
- All endpoints in `app/api/` now use Appwrite

### 4. Environment Variables
- **Removed**: `MONGODB_URI`
- **Added**: 
  - `APPWRITE_ENDPOINT` (defaults to https://cloud.appwrite.io/v1)
  - `APPWRITE_PROJECT_ID` (required)
  - `APPWRITE_API_KEY` (required)
  - `APPWRITE_DATABASE_ID` (defaults to 'prompt-hub')

### 5. Dependencies
- **Removed**: `mongodb@^6.9.0`
- **Added**: `node-appwrite@^18.0.0`

### 6. Scripts
- **Removed**: `npm run mongo:setup`
- **Added**: `npm run appwrite:setup`

### 7. Tests
- Updated all tests to use Appwrite configuration
- Renamed `mongodb.test.ts` to `appwrite.test.ts`
- All tests passing (120 tests, 1 skipped)

## New File Structure

```
lib/
├── appwrite/
│   ├── client.ts         # Appwrite client configuration
│   └── collections.ts    # Collection schemas and setup
├── mongodb/              # Backup of MongoDB files
│   ├── client.ts
│   └── collections.ts
└── repos/
    ├── promptRepo.ts     # Appwrite implementation
    ├── commentRepo.ts    # Appwrite implementation
    ├── ratingRepo.ts     # Appwrite implementation
    ├── promptRepo.mongodb.ts   # MongoDB backup
    ├── commentRepo.mongodb.ts  # MongoDB backup
    └── ratingRepo.mongodb.ts   # MongoDB backup
```

## Appwrite Collections Schema

### Prompts Collection
- `title` (string, required, 200 chars)
- `content` (string, required, 10000 chars)
- `authorId` (string, required, 50 chars)
- `description` (string, optional, 500 chars)
- `category` (string, required, 50 chars)
- `tags` (string array, optional)
- `isPublished` (boolean, required)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

### Comments Collection
- `promptId` (string, required, 50 chars)
- `userId` (string, required, 50 chars)
- `content` (string, required, 2000 chars)
- `parentId` (string, optional, 50 chars)
- `isEdited` (boolean, required)
- `isDeleted` (boolean, required)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

### Ratings Collection
- `promptId` (string, required, 50 chars)
- `userId` (string, required, 50 chars)
- `rating` (integer, required, 1-5)
- `comment` (string, optional, 1000 chars)
- `createdAt` (datetime, required)
- `updatedAt` (datetime, required)

## Key Differences from MongoDB

### 1. ID Management
- **MongoDB**: Uses `ObjectId` with `_id` field
- **Appwrite**: Uses string IDs with `$id` field

### 2. Querying
- **MongoDB**: Native aggregation pipelines and complex queries
- **Appwrite**: Query builder with predefined query methods
- **Search**: MongoDB text search replaced with Appwrite's built-in search capabilities

### 3. Data Conversion
All repository functions include conversion between Appwrite documents and application models:
- `convertToPromptModel()` / `convertToPromptDoc()`
- `convertToComment()` / `convertToCommentDoc()`
- `convertToRating()` / `convertToRatingDoc()`

### 4. Error Handling
- **MongoDB**: Native MongoDB errors
- **Appwrite**: HTTP-style error codes (404, 401, etc.)

## Setup Instructions

1. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your Appwrite credentials
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Setup Appwrite Collections**:
   ```bash
   npm run appwrite:setup
   ```

4. **Run Tests**:
   ```bash
   npm test
   ```

## Migration Benefits

1. **Managed Service**: No need to manage MongoDB infrastructure
2. **Real-time**: Built-in real-time subscriptions
3. **Security**: Built-in authentication and permissions
4. **Scalability**: Automatic scaling and performance optimization
5. **Modern API**: RESTful API with SDKs for multiple languages

## Rollback Plan

If needed, the MongoDB implementation can be restored:
1. Restore MongoDB files from `lib/mongodb/`
2. Restore repository files from `*.mongodb.ts` backups
3. Update API routes to check `MONGODB_URI`
4. Restore MongoDB dependency in package.json
5. Update tests to use MongoDB configuration

## Testing

All existing functionality has been preserved:
- ✅ Prompt CRUD operations
- ✅ Comment threading and soft delete
- ✅ Rating system with statistics
- ✅ Search and filtering
- ✅ Category management
- ✅ Full test suite passing

The migration maintains 100% API compatibility with existing frontend code.
