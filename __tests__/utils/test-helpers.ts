import { jest } from '@jest/globals';

/**
 * Test utilities for consistent test setup and teardown
 */

// Mock environment variables for testing
export const mockEnv = (envVars: Record<string, string | undefined>) => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.entries(envVars).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });
};

// Enhanced mock cleanup
export const cleanupMocks = () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
};

// Async test utilities
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await waitFor(interval);
  }

  throw new Error(`Condition not met within ${timeout}ms`);
};

// Database test helpers
export const withTestDb = (testFn: () => Promise<void>) => {
  return async () => {
    try {
      await testFn();
    } finally {
      // Add cleanup logic here if needed
    }
  };
};
