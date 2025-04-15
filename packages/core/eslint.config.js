import { createESLintConfig } from '../../config/eslint/index.js';

// Core package specific configuration
const coreSpecificConfig = [
  {
    files: ['src/**/*.ts'],
    rules: {
      // Add core-specific rules here if needed
    },
  },
];

export default createESLintConfig(coreSpecificConfig);
