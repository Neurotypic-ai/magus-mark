import { createESLintConfig } from '../../config/eslint/index.js';

// Obsidian plugin specific configuration
const obsidianSpecificConfig = [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // Add Obsidian-specific rules here if needed
    },
  },
];

export default createESLintConfig(obsidianSpecificConfig);
