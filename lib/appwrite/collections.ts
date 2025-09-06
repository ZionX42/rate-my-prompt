import { getAppwriteDb, COLLECTIONS, ID } from './client';
import { Query, IndexType } from 'node-appwrite';
import type { Models } from 'node-appwrite';

// Document type definitions for Appwrite collections
export interface PromptDoc extends Models.Document {
  title: string;
  content: string;
  authorId: string;
  description?: string;
  category: string;
  tags: string[];
  isPublished: boolean;
}

export interface CommentDoc extends Models.Document {
  promptId: string;
  userId: string;
  content: string;
  parentId?: string;
  isEdited: boolean;
  isDeleted: boolean;
}

export interface RatingDoc extends Models.Document {
  promptId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface UserDoc extends Models.Document {
  displayName: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
  joinedAt: string; // ISO datetime string from Appwrite
  passwordHash?: string; // Hashed password for authentication
}

export async function getCollections() {
  const { databases, databaseId } = await getAppwriteDb();

  return {
    prompts: {
      collectionId: COLLECTIONS.PROMPTS,
      create: (data: Omit<PromptDoc, keyof Models.Document | 'createdAt' | 'updatedAt'>) =>
        databases.createDocument<PromptDoc>(databaseId, COLLECTIONS.PROMPTS, ID.unique(), data),
      get: (documentId: string) =>
        databases.getDocument<PromptDoc>(databaseId, COLLECTIONS.PROMPTS, documentId),
      list: (queries: string[] = []) =>
        databases.listDocuments<PromptDoc>(databaseId, COLLECTIONS.PROMPTS, queries),
      update: (documentId: string, data: Partial<PromptDoc>) =>
        databases.updateDocument<PromptDoc>(databaseId, COLLECTIONS.PROMPTS, documentId, data),
      delete: (documentId: string) =>
        databases.deleteDocument(databaseId, COLLECTIONS.PROMPTS, documentId),
    },
    comments: {
      collectionId: COLLECTIONS.COMMENTS,
      create: (data: Omit<CommentDoc, keyof Models.Document | 'createdAt' | 'updatedAt'>) =>
        databases.createDocument<CommentDoc>(databaseId, COLLECTIONS.COMMENTS, ID.unique(), data),
      get: (documentId: string) =>
        databases.getDocument<CommentDoc>(databaseId, COLLECTIONS.COMMENTS, documentId),
      list: (queries: string[] = []) =>
        databases.listDocuments<CommentDoc>(databaseId, COLLECTIONS.COMMENTS, queries),
      update: (documentId: string, data: Partial<CommentDoc>) =>
        databases.updateDocument<CommentDoc>(databaseId, COLLECTIONS.COMMENTS, documentId, data),
      delete: (documentId: string) =>
        databases.deleteDocument(databaseId, COLLECTIONS.COMMENTS, documentId),
    },
    ratings: {
      collectionId: COLLECTIONS.RATINGS,
      create: (data: Omit<RatingDoc, keyof Models.Document | 'createdAt' | 'updatedAt'>) =>
        databases.createDocument<RatingDoc>(databaseId, COLLECTIONS.RATINGS, ID.unique(), data),
      get: (documentId: string) =>
        databases.getDocument<RatingDoc>(databaseId, COLLECTIONS.RATINGS, documentId),
      list: (queries: string[] = []) =>
        databases.listDocuments<RatingDoc>(databaseId, COLLECTIONS.RATINGS, queries),
      update: (documentId: string, data: Partial<RatingDoc>) =>
        databases.updateDocument<RatingDoc>(databaseId, COLLECTIONS.RATINGS, documentId, data),
      delete: (documentId: string) =>
        databases.deleteDocument(databaseId, COLLECTIONS.RATINGS, documentId),
    },
    users: {
      collectionId: COLLECTIONS.USERS,
      create: (data: Omit<UserDoc, keyof Models.Document>) =>
        databases.createDocument<UserDoc>(databaseId, COLLECTIONS.USERS, ID.unique(), data),
      get: (documentId: string) =>
        databases.getDocument<UserDoc>(databaseId, COLLECTIONS.USERS, documentId),
      list: (queries: string[] = []) =>
        databases.listDocuments<UserDoc>(databaseId, COLLECTIONS.USERS, queries),
      update: (documentId: string, data: Partial<UserDoc>) =>
        databases.updateDocument<UserDoc>(databaseId, COLLECTIONS.USERS, documentId, data),
      delete: (documentId: string) =>
        databases.deleteDocument(databaseId, COLLECTIONS.USERS, documentId),
    },
  };
}

// Collection setup function to create collections and attributes (idempotent + auto-heal)
export async function ensureCollections() {
  const { databases, databaseId } = await getAppwriteDb();

  // Helpers
  const getErrCode = (err: unknown): number | undefined => {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const c = (err as { code?: unknown }).code;
      return typeof c === 'number' ? c : undefined;
    }
    return undefined;
  };

  const ensureCollection = async (id: string, name: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (databases as any).getCollection(databaseId, id);
      return false; // exists
    } catch (e) {
      const code = getErrCode(e);
      if (code === 404) {
        await databases.createCollection(databaseId, id, name, undefined, false);
        return true; // created
      }
      if (code === 409) return false;
      throw e;
    }
  };

  const ensureAttributes = async (
    collectionId: string,
    defs: Array<
      | { kind: 'string'; key: string; size: number; required: boolean; array?: boolean }
      | { kind: 'int'; key: string; required: boolean; min?: number; max?: number }
      | { kind: 'bool'; key: string; required: boolean; default?: boolean }
      | { kind: 'datetime'; key: string; required: boolean }
    >
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = (await (databases as any).listAttributes(databaseId, collectionId)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = new Map<string, any>();
    for (const a of res?.attributes ?? []) existing.set(a.key, a);

    for (const def of defs) {
      const cur = existing.get(def.key);
      if (!cur) {
        if (def.kind === 'string') {
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            def.key,
            def.size,
            def.required,
            undefined,
            def.array === true
          );
        } else if (def.kind === 'int') {
          await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            def.key,
            def.required,
            def.min,
            def.max
          );
        } else if (def.kind === 'bool') {
          if (def.required) {
            await databases.createBooleanAttribute(databaseId, collectionId, def.key, true);
          } else {
            await databases.createBooleanAttribute(
              databaseId,
              collectionId,
              def.key,
              false,
              def.default ?? false
            );
          }
        } else if (def.kind === 'datetime') {
          await databases.createDatetimeAttribute(databaseId, collectionId, def.key, def.required);
        }
        continue;
      }
      // warn on drift (non-destructive)
      try {
        if (def.kind === 'string') {
          if (cur.type !== 'string' || cur.size < def.size || !!cur.array !== !!def.array) {
            console.warn(
              `Attribute drift in ${collectionId}.${def.key}: expected string(size>=${def.size}, array=${!!def.array}), got ${cur.type}(size=${cur.size}, array=${!!cur.array}).`
            );
          }
        } else if (def.kind === 'int') {
          if (cur.type !== 'integer') {
            console.warn(
              `Attribute drift in ${collectionId}.${def.key}: expected integer, got ${cur.type}.`
            );
          }
        } else if (def.kind === 'bool') {
          if (cur.type !== 'boolean') {
            console.warn(
              `Attribute drift in ${collectionId}.${def.key}: expected boolean, got ${cur.type}.`
            );
          }
        } else if (def.kind === 'datetime') {
          if (cur.type !== 'datetime') {
            console.warn(
              `Attribute drift in ${collectionId}.${def.key}: expected datetime, got ${cur.type}.`
            );
          }
        }
      } catch {
        /* best effort */
      }
    }
  };

  const ensureIndexes = async (
    collectionId: string,
    defs: Array<{ key: string; type: IndexType; attrs: string[] }>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = (await (databases as any).listIndexes(databaseId, collectionId)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = new Map<string, any>();
    for (const idx of res?.indexes ?? []) existing.set(idx.key, idx);

    // small deterministic hash for temp index names
    const hash = (s: string) => {
      let h = 5381;
      for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
      return (h >>> 0).toString(36);
    };

    for (const def of defs) {
      const cur = existing.get(def.key);
      if (!cur) {
        await databases.createIndex(databaseId, collectionId, def.key, def.type, def.attrs);
        continue;
      }
      // warn on drift; optionally auto-heal
      try {
        const curAttrs = Array.isArray(cur.attributes) ? cur.attributes : (cur.attributes ?? []);
        const sameAttrs =
          curAttrs.length === def.attrs.length &&
          curAttrs.every((a: string, i: number) => a === def.attrs[i]);
        const sameType =
          (cur.type as string)?.toLowerCase() === (def.type as unknown as string)?.toLowerCase();
        if (!sameType || !sameAttrs) {
          console.warn(
            `Index drift in ${collectionId}.${def.key}: expected type=${def.type}, attrs=[${def.attrs.join(',')}], got type=${cur.type}, attrs=[${curAttrs.join(',')}].`
          );

          // Attempt safe auto-heal
          const specStr = JSON.stringify({ t: def.type, a: def.attrs });
          const tempKey = `${def.key}__desired_${hash(specStr)}`;
          // 1) ensure temp index exists
          try {
            await databases.createIndex(databaseId, collectionId, tempKey, def.type, def.attrs);
          } catch (e) {
            const code = getErrCode(e);
            if (code !== 409) throw e;
          }
          // 2) delete mismatched original
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (databases as any).deleteIndex(databaseId, collectionId, def.key);
          } catch (e) {
            const code = getErrCode(e);
            if (code && code !== 404) throw e;
          }
          // 3) create intended index with correct key
          try {
            await databases.createIndex(databaseId, collectionId, def.key, def.type, def.attrs);
          } catch (e) {
            const code = getErrCode(e);
            if (code !== 409) throw e;
          }
          // 4) cleanup temp if final looks correct
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const latest = (await (databases as any).listIndexes(databaseId, collectionId)) as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalIdx = latest?.indexes?.find((i: any) => i.key === def.key);
            const finalAttrs = Array.isArray(finalIdx?.attributes)
              ? finalIdx.attributes
              : (finalIdx?.attributes ?? []);
            const finalSame =
              (finalIdx?.type as string)?.toLowerCase() ===
                (def.type as unknown as string)?.toLowerCase() &&
              finalAttrs.length === def.attrs.length &&
              finalAttrs.every((a: string, i: number) => a === def.attrs[i]);
            if (finalSame) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (databases as any).deleteIndex(databaseId, collectionId, tempKey);
              } catch {
                /* cleanup best-effort */
              }
            }
          } catch {
            /* best effort */
          }
        }
      } catch {
        /* best effort */
      }
    }
  };

  // Prompts
  await ensureCollection(COLLECTIONS.PROMPTS, 'Prompts');
  await ensureAttributes(COLLECTIONS.PROMPTS, [
    { kind: 'string', key: 'title', size: 200, required: true },
    { kind: 'string', key: 'content', size: 10000, required: true },
    { kind: 'string', key: 'authorId', size: 50, required: true },
    { kind: 'string', key: 'description', size: 500, required: false },
    { kind: 'string', key: 'category', size: 50, required: true },
    { kind: 'string', key: 'tags', size: 50, required: false, array: true },
    { kind: 'bool', key: 'isPublished', required: true, default: false },
    { kind: 'datetime', key: 'createdAt', required: true },
    { kind: 'datetime', key: 'updatedAt', required: true },
  ]);
  await ensureIndexes(COLLECTIONS.PROMPTS, [
    { key: 'authorId_idx', type: IndexType.Key, attrs: ['authorId'] },
    { key: 'category_idx', type: IndexType.Key, attrs: ['category'] },
    { key: 'published_idx', type: IndexType.Key, attrs: ['isPublished'] },
    { key: 'created_idx', type: IndexType.Key, attrs: ['createdAt'] },
    // Enhanced full-text indexes for multi-field search
    { key: 'title_fulltext_idx', type: IndexType.Fulltext, attrs: ['title'] },
    { key: 'description_fulltext_idx', type: IndexType.Fulltext, attrs: ['description'] },
    { key: 'content_fulltext_idx', type: IndexType.Fulltext, attrs: ['content'] },
    {
      key: 'title_description_fulltext_idx',
      type: IndexType.Fulltext,
      attrs: ['title', 'description'],
    },
    { key: 'title_content_fulltext_idx', type: IndexType.Fulltext, attrs: ['title', 'content'] },
    // Key indexes for efficient filtering
    { key: 'tags_idx', type: IndexType.Key, attrs: ['tags'] },
    { key: 'author_category_idx', type: IndexType.Key, attrs: ['authorId', 'category'] },
    { key: 'category_published_idx', type: IndexType.Key, attrs: ['category', 'isPublished'] },
    { key: 'author_published_idx', type: IndexType.Key, attrs: ['authorId', 'isPublished'] },
  ]);

  // Comments
  await ensureCollection(COLLECTIONS.COMMENTS, 'Comments');
  await ensureAttributes(COLLECTIONS.COMMENTS, [
    { kind: 'string', key: 'promptId', size: 50, required: true },
    { kind: 'string', key: 'userId', size: 50, required: true },
    { kind: 'string', key: 'content', size: 2000, required: true },
    { kind: 'string', key: 'parentId', size: 50, required: false },
    { kind: 'bool', key: 'isEdited', required: true, default: false },
    { kind: 'bool', key: 'isDeleted', required: true, default: false },
    { kind: 'datetime', key: 'createdAt', required: true },
    { kind: 'datetime', key: 'updatedAt', required: true },
  ]);
  await ensureIndexes(COLLECTIONS.COMMENTS, [
    { key: 'promptId_idx', type: IndexType.Key, attrs: ['promptId'] },
    { key: 'userId_idx', type: IndexType.Key, attrs: ['userId'] },
    { key: 'created_idx', type: IndexType.Key, attrs: ['createdAt'] },
    // Enhanced indexes for comment search
    { key: 'content_fulltext_idx', type: IndexType.Fulltext, attrs: ['content'] },
    { key: 'user_prompt_idx', type: IndexType.Key, attrs: ['userId', 'promptId'] },
    { key: 'isDeleted_idx', type: IndexType.Key, attrs: ['isDeleted'] },
    { key: 'parentId_idx', type: IndexType.Key, attrs: ['parentId'] },
  ]);

  // Ratings
  await ensureCollection(COLLECTIONS.RATINGS, 'Ratings');
  await ensureAttributes(COLLECTIONS.RATINGS, [
    { kind: 'string', key: 'promptId', size: 50, required: true },
    { kind: 'string', key: 'userId', size: 50, required: true },
    { kind: 'int', key: 'rating', required: true, min: 1, max: 5 },
    { kind: 'string', key: 'comment', size: 1000, required: false },
    { kind: 'datetime', key: 'createdAt', required: true },
    { kind: 'datetime', key: 'updatedAt', required: true },
  ]);
  await ensureIndexes(COLLECTIONS.RATINGS, [
    { key: 'promptId_idx', type: IndexType.Key, attrs: ['promptId'] },
    { key: 'userId_idx', type: IndexType.Key, attrs: ['userId'] },
    { key: 'user_prompt_idx', type: IndexType.Key, attrs: ['userId', 'promptId'] },
  ]);

  // Users
  await ensureCollection(COLLECTIONS.USERS, 'Users');
  await ensureAttributes(COLLECTIONS.USERS, [
    { kind: 'string', key: 'displayName', size: 100, required: true },
    { kind: 'string', key: 'email', size: 320, required: false },
    { kind: 'string', key: 'bio', size: 1000, required: false },
    { kind: 'string', key: 'avatarUrl', size: 1000, required: false },
    { kind: 'string', key: 'role', size: 20, required: true },
    { kind: 'bool', key: 'isActive', required: true, default: true },
    { kind: 'datetime', key: 'joinedAt', required: true },
    { kind: 'datetime', key: 'updatedAt', required: true },
  ]);
  await ensureIndexes(COLLECTIONS.USERS, [
    { key: 'email_idx', type: IndexType.Key, attrs: ['email'] },
    { key: 'role_idx', type: IndexType.Key, attrs: ['role'] },
    // Enhanced indexes for user search
    { key: 'displayName_fulltext_idx', type: IndexType.Fulltext, attrs: ['displayName'] },
    { key: 'bio_fulltext_idx', type: IndexType.Fulltext, attrs: ['bio'] },
    { key: 'isActive_idx', type: IndexType.Key, attrs: ['isActive'] },
    { key: 'joinedAt_idx', type: IndexType.Key, attrs: ['joinedAt'] },
  ]);
}

export { Query };
