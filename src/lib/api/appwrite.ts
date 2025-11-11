// Utility function to check if Appwrite is properly configured
export function isAppwriteConfigured(): boolean {
  return !!(process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY);
}

// Environment variable check for Appwrite
export function requireAppwriteConfig(): string | null {
  if (!isAppwriteConfigured()) {
    return 'Storage not configured - APPWRITE_PROJECT_ID and APPWRITE_API_KEY required';
  }
  return null;
}
