// Appwrite client helper for browser-side auth flows
// Uses environment variables: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID
// Server-side operations requiring API key should use a separate server-only module (not yet implemented here)

import { Client, Account, ID } from 'appwrite';

// Guard against SSR import issues (Next.js) by lazy initializing
let _account: Account | null = null;

export function missingAppwriteEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
    missing.push('NEXT_PUBLIC_APPWRITE_ENDPOINT');
  }
  if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    missing.push('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  }
  return missing;
}

function getAccount(): Account {
  if (_account) return _account;
  const missing = missingAppwriteEnvVars();
  if (missing.length > 0) {
    throw new Error(`Appwrite env vars missing: ${missing.join(', ')}`);
  }
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string;
  const client = new Client().setEndpoint(endpoint).setProject(project);
  _account = new Account(client);
  return _account;
}

export async function appwriteSignup(email: string, password: string, name?: string) {
  const account = getAccount();
  return account.create({ userId: ID.unique(), email, password, name });
}

export async function appwriteLogin(email: string, password: string) {
  const account = getAccount();
  return account.createEmailPasswordSession({ email, password });
}

export async function appwriteLogout() {
  try {
    const account = getAccount();
    await account.deleteSession('current');
  } catch {
    // ignore intentionally
  }
}

export async function appwriteCreateJWT(): Promise<string | null> {
  try {
    const account = getAccount();
    const result = await account.createJWT();
    if (!result || typeof result.jwt !== 'string' || result.jwt.length === 0) {
      return null;
    }
    return result.jwt;
  } catch (error) {
    console.warn('Appwrite: Failed to create JWT for session sync', error);
    return null;
  }
}

export async function appwriteCurrentUser() {
  try {
    const account = getAccount();
    return await account.get();
  } catch {
    return null;
  }
}

export function appwriteEnvReady(): boolean {
  return missingAppwriteEnvVars().length === 0;
}

export type AppwriteAuthProvider = 'local' | 'appwrite';
