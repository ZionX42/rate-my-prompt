import { Client, Databases, Permission, Role, IndexType } from 'node-appwrite';

const requiredEnv = [
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_PROFILES_COLLECTION_ID',
];

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

async function ensureProfilesCollection(databases: Databases) {
  const databaseId = process.env.APPWRITE_DATABASE_ID as string;
  const collectionId = process.env.APPWRITE_PROFILES_COLLECTION_ID as string;

  try {
    await databases.getCollection(databaseId, collectionId);
    console.info(`Collection ${collectionId} already exists.`);
  } catch (error) {
    console.info(`Creating profiles collection ${collectionId}`);
    console.debug('getCollection failed, proceeding with createCollection', error);
    await databases.createCollection(databaseId, collectionId, 'profiles', [
      Permission.read(Role.any()),
      Permission.update(Role.user('userId')),
      Permission.delete(Role.user('userId')),
      Permission.create(Role.user('userId')),
    ]);
  }

  const attributes = [
    { method: 'createStringAttribute', args: [collectionId, 'userId', 36, true] as const },
    { method: 'createStringAttribute', args: [collectionId, 'username', 64, true] as const },
    { method: 'createStringAttribute', args: [collectionId, 'displayName', 120, true] as const },
    { method: 'createStringAttribute', args: [collectionId, 'bio', 1024, false] as const },
    { method: 'createStringAttribute', args: [collectionId, 'avatarFileId', 128, false] as const },
    { method: 'createUrlAttribute', args: [collectionId, 'avatarUrl', false] as const },
    { method: 'createBooleanAttribute', args: [collectionId, 'disabled', false, false] as const },
    {
      method: 'createBooleanAttribute',
      args: [collectionId, 'privacyConsent', false, false] as const,
    },
    { method: 'createDatetimeAttribute', args: [collectionId, 'createdAt', true] as const },
    { method: 'createDatetimeAttribute', args: [collectionId, 'updatedAt', true] as const },
  ] as const;

  for (const attribute of attributes) {
    try {
      // @ts-expect-error - dynamic method invocation
      await databases[attribute.method](databaseId, ...attribute.args);
      console.info(`Ensured attribute ${attribute.args[1]}`);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code: number }).code === 409) {
        console.info(`Attribute ${attribute.args[1]} already exists.`);
      } else {
        throw error;
      }
    }
  }

  const indexes = [
    {
      key: 'idx_username_unique',
      type: 'unique' as IndexType,
      attributes: ['username'],
    },
    {
      key: 'idx_userId',
      type: 'key' as IndexType,
      attributes: ['userId'],
    },
  ];

  for (const index of indexes) {
    try {
      await databases.createIndex(
        databaseId,
        collectionId,
        index.key,
        index.type,
        index.attributes
      );
      console.info(`Created index ${index.key}`);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code: number }).code === 409) {
        console.info(`Index ${index.key} already exists.`);
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  assertEnv();

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT as string)
    .setProject(process.env.APPWRITE_PROJECT_ID as string)
    .setKey(process.env.APPWRITE_API_KEY as string);

  const databases = new Databases(client);
  await ensureProfilesCollection(databases);

  console.info('Database setup complete.');
}

main().catch((error) => {
  console.error('Database setup failed', error);
  process.exit(1);
});
