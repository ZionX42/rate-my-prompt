import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      'app/generated/**/*',
      'prisma/generated/**/*',
      '**/generated/**/*',
      'coverage/**/*',
      'node_modules/**/*',
      'app/generated/prisma/runtime/**/*',
      'app/generated/prisma/wasm.js',
      'app/generated/prisma/wasm-engine-edge.js',
      'app/generated/prisma/runtime/wasm-engine-edge.js',
      '.next/**/*',
      '.next/types/**/*',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off', // Too many false positives in generated code
      '@typescript-eslint/no-this-alias': 'off', // Generated code
      '@typescript-eslint/no-require-imports': 'off', // For config files
      '@typescript-eslint/triple-slash-reference': 'off', // For Next.js types
      'import/no-anonymous-default-export': 'off', // For config files
    },
  },
  {
    files: ['cypress/support/component.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
];

export default eslintConfig;
