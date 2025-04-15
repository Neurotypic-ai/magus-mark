import { createESLintConfig } from '../config/eslint/index.js';

// Documentation specific configuration
const docSpecificConfig = [
  {
    files: ['**/*.md'],
    rules: {
      // Add documentation-specific rules here if needed
    },
  },
];

export default createESLintConfig(docSpecificConfig);
