import { createESLintConfig } from '@magus-mark/eslint-config';

// @type {import('eslint').Linter.FlatConfig}
export default createESLintConfig([
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Ensure accessibility for UI components
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
    },
  },
]);
