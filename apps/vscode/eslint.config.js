import { createESLintConfig } from '../../config/eslint/index.js';

// VS Code app specific configuration
const vscodeSpecificConfig = [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // Add VS Code-specific rules here if needed
    },
  },
];

export default createESLintConfig(vscodeSpecificConfig);
