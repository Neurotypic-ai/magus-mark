import { createESLintConfig } from '@magus-mark/eslint-config';

export default createESLintConfig([
  // Global ignores
  {
    ignores: [
      '**/*.md',
      '**/README.md',
      'dist/**',
      'node_modules/**',
      '*.tsbuildinfo',
    ],
  },
  // CLI-specific overrides
  {
    files: ['src/**/*.ts'],
    rules: {
      // Allow console for CLI applications
      'no-console': 'off',
      // CLI applications may need process.exit
      'unicorn/no-process-exit': 'off',
    },
  },
  // Test file overrides
  {
    files: ['src/**/*.test.ts', 'src/**/__mocks__/**/*.ts'],
    rules: {
      // Allow some flexibility in test files
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
]);
