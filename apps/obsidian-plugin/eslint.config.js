import { createESLintConfig } from '@magus-mark/eslint-config';

// @type {import('eslint').Linter.FlatConfig}
export default createESLintConfig([
  // 1) Global ignores (optional)
  { ignores: ['**/tests/**', 'src/**/__mocks__/**'] },

  // 2) Disable TS rules in test & mock files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/**/__mocks__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-misused-spread': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  // 3) Your existing src rules
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
    },
  },
]);
