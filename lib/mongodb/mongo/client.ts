import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'prompt_hub';

// Avoid mutating NODE_ENV; just read it when needed

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

declare global {
  // eslint-disable-next-line no-var, no-unused-vars
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Please set it in your environment.');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    // Non-null assertion because we just set it above
    return global._mongoClientPromise!;
  }

  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise!;
}

export async function getDb(): Promise<Db> {
  const c = await getMongoClient();
  return c.db(dbName);
}

