/* eslint-disable @typescript-eslint/no-unused-vars */
import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load environment variables from .env.local for tests
dotenv.config({ path: '.env.local' });

// Polyfill Fetch API for tests (Request/Response/fetch) if missing
try {
  // Ensure TextEncoder/TextDecoder exist for libraries that expect them (e.g., undici)
  const { TextEncoder, TextDecoder } = require('node:util');
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
  }
  if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
  }

  // Ensure Web Streams exist (ReadableStream, etc.)
  try {
    const streams = require('node:stream/web');
    if (typeof global.ReadableStream === 'undefined') {
      global.ReadableStream = streams.ReadableStream;
    }
    if (typeof global.WritableStream === 'undefined') {
      global.WritableStream = streams.WritableStream;
    }
    if (typeof global.TransformStream === 'undefined') {
      global.TransformStream = streams.TransformStream;
    }
  } catch (e) {
    // ignore missing stream/web (older Node)
  }

  // Add setImmediate polyfill for Winston
  if (typeof global.setImmediate === 'undefined') {
    global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
  }

  const g = global;
  if (typeof g.Request === 'undefined' || typeof g.fetch === 'undefined') {
    const { fetch, Headers, Request, Response } = require('undici');
    g.fetch = fetch;
    g.Headers = Headers;
    g.Request = Request;
    g.Response = Response;
  }
} catch (e) {
  // ignore
}

// Enhanced mock cleanup and test utilities
afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Clear any lingering async operations
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global test utilities
global.testUtils = {
  waitFor: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  waitForCondition: async (condition, timeout = 5000, interval = 100) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) return;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  },
};

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});
