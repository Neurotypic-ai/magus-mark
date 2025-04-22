import customConfig from 'eslint-config-custom';

export default [
  ...customConfig,

  // CLI-specific overrides
  {
    files: ['src/**/*.ts'],
    rules: {
      // Allow console for CLI applications
      'no-console': 'off',
    },
  },
];
