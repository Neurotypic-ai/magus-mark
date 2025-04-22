// Import the configuration from the local index.js file
import customConfig from './index.js';

// Example eslint.config.js that can be copied by projects
export default [
  ...customConfig,

  // Add any project-specific overrides here
  {
    files: ['src/**/*.ts'],
    rules: {
      // Project-specific rule overrides
    },
  },
];
