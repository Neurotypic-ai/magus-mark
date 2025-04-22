import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the config/eslint directory
const eslintConfigPath = resolve(__dirname, '../../config/eslint');

/**
 * Main ESLint configuration that can be imported by any project
 *
 * @type {import('eslint').Linter.Config}
 */
export default [
  // Base configuration for all files
  {
    name: 'custom-base',
    ignores: ['**/node_modules/**', '**/dist/**', '**/.vscode/**', '**/.cursor/**', '**/coverage/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // Import the base config from the existing config/eslint directory
  {
    name: 'import-base-configs',
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    extends: [`${eslintConfigPath}/base.js`, `${eslintConfigPath}/typescript.js`],
  },

  // Optional React configuration (loaded conditionally based on dependencies)
  {
    name: 'import-react-config',
    files: ['**/*.{jsx,tsx}'],
    extends: [`${eslintConfigPath}/react.config.js`],
  },

  // Testing configuration
  {
    name: 'import-test-config',
    files: ['**/*.{test,spec}.{js,mjs,cjs,jsx,ts,tsx}', '**/__tests__/**'],
    extends: [`${eslintConfigPath}/test.js`],
  },
];
