import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import importXPlugin from 'eslint-plugin-import-x';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TypeScript base configuration
const tsStrictTypeChecked = tseslint.configs.strictTypeChecked[2] ?? undefined; // Get the actual recommended rules
const tsStylisticTypeChecked = tseslint.configs.stylisticTypeChecked[2] ?? undefined; // Get the actual stylistic rules

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
export const tsConfig = {
  files: ['**/*.{ts,tsx}'],
  plugins: {
    '@typescript-eslint': tseslint.plugin,
    react: reactPlugin,
    'jsx-a11y': jsxA11yPlugin,
    'react-hooks': reactHooksPlugin,
    'import-x': importXPlugin,
  },
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: __dirname,
    },
  },
  settings: {
    react: {
      version: '19',
    },
    'import-x/resolver': {
      typescript: true,
      node: true,
    },
  },
  rules: {
    ...importXPlugin.configs.recommended.rules,
    ...importXPlugin.configs.typescript.rules,

    // React and JSX rules
    ...(reactPlugin.configs.flat?.['recommended']?.rules || {}),
    ...(reactPlugin.configs.flat?.['jsx-runtime']?.rules || {}),
    ...reactHooksPlugin.configs.recommended.rules,
    ...jsxA11yPlugin.flatConfigs.recommended.rules,

    ...(tsStrictTypeChecked?.rules || {}),
    ...(tsStylisticTypeChecked?.rules || {}),

    'import-x/order': 'off',

    // Custom TypeScript rules
    'react/prop-types': 'off',
    'react/jsx-no-leaked-render': ['warn', { validStrategies: ['ternary'] }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-import-type-side-effects': 'error',
    '@typescript-eslint/only-throw-error': [
      'error',
      {
        allow: [
          { from: 'lib', name: 'Response' },
          { from: 'package', name: 'redirect', package: 'react-router' },
          { from: 'package', name: 'redirect', package: 'react-router-dom' },
        ],
        allowThrowingAny: false,
        allowThrowingUnknown: false,
      },
    ],
  },
};
