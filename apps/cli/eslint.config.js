import { createESLintConfig } from '../../config/eslint/index.js';

// CLI app specific configuration
const cliSpecificConfig = [
  {
    files: ['src/**/*.ts'],
    rules: {
      // Add CLI-specific rules here if needed
    },
  },
];

export default createESLintConfig(cliSpecificConfig);
