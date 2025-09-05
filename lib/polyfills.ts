/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Polyfill for assert in Edge Runtime
if (typeof (globalThis as any).assert === 'undefined') {
  (globalThis as any).assert = function (condition: boolean, message?: string) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  };
}

// Polyfill for other Node.js globals if needed
if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = {
    env: {
      NODE_ENV: 'development',
    },
    version: 'v18.0.0',
    platform: 'linux',
  };
}
