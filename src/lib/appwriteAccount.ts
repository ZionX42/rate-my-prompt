import { Client, Account } from 'appwrite';

let _account: Account | null = null;

export function getAppwriteAccount(): Account {
  if (_account) return _account;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !project) throw new Error('Missing Appwrite public env vars');
  const client = new Client().setEndpoint(endpoint).setProject(project);
  _account = new Account(client);
  return _account;
}
