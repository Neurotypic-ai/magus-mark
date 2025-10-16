import { createESLintConfig } from '@magus-mark/eslint-config';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config[]} */
export default createESLintConfig([
  {
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      // Allow some flexibility in test files
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
    },
  },
]);
