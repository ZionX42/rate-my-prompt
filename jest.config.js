import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  watchman: false,
  watchPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.git/'],
  coverageDirectory: 'coverage',
  // Load test environment variables
  setupFiles: ['<rootDir>/jest.env.js'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'test/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!<rootDir>/out/**',
    '!<rootDir>/.next/**',
    '!<rootDir>/*.config.js',
    '!<rootDir>/coverage/**',
    '!**/generated/**',
    '!**/prisma/**',
    '!**/runtime/**',
    '!app/**/layout.tsx',
    '!app/**/loading.tsx',
    '!app/**/not-found.tsx',
    '!app/**/error.tsx',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/cypress/',
    '/generated/',
    '/prisma/',
    '/runtime/',
    '\\.d\\.ts$',
  ],
  moduleNameMapper: {
    // Handle module aliases (if you have configured them in your Next.js config)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/(.*)$': '<rootDir>/$1',
    // Stub ESM-only fetch polyfill used by node-appwrite to a CJS-friendly mock
    '^node-fetch-native-with-agent$': '<rootDir>/__mocks__/node-fetch-native-with-agent.js',
    // Mock jose library to avoid ESM issues
    '^jose$': '<rootDir>/__mocks__/jose.js',
  },
  // Transform ESM modules that need to be compiled
  transformIgnorePatterns: ['node_modules/(?!(jose|@panva)/)'],
  // Add test timeout for slow tests
  testTimeout: 10000,
  // Force exit to prevent hanging
  forceExit: true,
  detectOpenHandles: true,
  // Ignore Playwright tests and utility files
  testPathIgnorePatterns: [
    '<rootDir>/e2e/',
    '<rootDir>/cypress/',
    '<rootDir>/__tests__/utils/',
    '<rootDir>/node_modules/',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
