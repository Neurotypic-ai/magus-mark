import { createESLintConfig } from '@magus-mark/eslint-config';

export default createESLintConfig([
  // CLI-specific overrides
  {
    files: ['src/**/*.ts'],
    rules: {
      // Allow console for CLI applications
      'no-console': 'off',
    },
  },
]);
