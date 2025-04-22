import customConfig from 'eslint-config-custom';

export default [
  ...customConfig,

  // Obsidian-specific overrides
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Ensure accessibility for UI components
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
    },
  },
];
