import { createESLintConfig } from '@magus-mark/eslint-config';

export default createESLintConfig([
  // VS Code-specific overrides
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Allow VS Code API usage patterns
      'no-unused-expressions': 'off',
      // Ensure accessibility for VS Code UI components
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
    },
  },
]);
