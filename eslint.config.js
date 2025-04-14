import console from 'node:console';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import markdownPlugin from '@eslint/markdown';
import prettierConfig from 'eslint-config-prettier';
import importXPlugin from 'eslint-plugin-import-x';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.info(__dirname);

const DEBUG = process.env['NODE_ENV'] === 'development' && process.env['DEBUG'] === 'true';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const baseConfig = {
  files: ['**/*'],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.es2024,
      ...globals.node,
    },
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
        impliedStrict: true,
      },
    },
  },
  ...prettierConfig,
};

// JavaScript configuration
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const jsConfig = {
  files: ['**/*.{js,jsx}'],
  plugins: {
    react: reactPlugin,
    'jsx-a11y': jsxA11yPlugin,
    'react-hooks': reactHooksPlugin,
  },
  rules: {
    ...js.configs.recommended.rules,
    ...(reactPlugin.configs.flat?.['recommended']?.rules || {}),
    ...(reactPlugin.configs.flat?.['jsx-runtime']?.rules || {}),
    ...reactHooksPlugin.configs.recommended.rules,
    ...jsxA11yPlugin.flatConfigs.recommended.rules,
    'react/jsx-no-leaked-render': ['warn', { validStrategies: ['ternary'] }],
  },
  settings: {
    react: {
      version: '19',
    },
    formComponents: ['Form'],
    linkComponents: [
      { name: 'Link', linkAttribute: 'to' },
      { name: 'NavLink', linkAttribute: 'to' },
    ],
  },
};

// TypeScript base configuration
const tsStrictTypeChecked = tseslint.configs.strictTypeChecked[2] ?? undefined; // Get the actual recommended rules
const tsStylisticTypeChecked = tseslint.configs.stylisticTypeChecked[2] ?? undefined; // Get the actual stylistic rules

// TypeScript configuration
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const tsConfig = {
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

// Markdown TypeScript configuration
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const markdownTsConfig = {
  files: ['**/*.md/**/*.{ts,tsx}'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      // Explicitly disable project for markdown code blocks
      project: null,
      projectService: false,
    },
  },
  rules: {
    ...tseslint.configs.base.rules,
    ...tseslint.configs.disableTypeChecked.rules,
    '@typescript-eslint/no-unused-vars': 'off',
    'import-x/no-unresolved': 'off',
  },
};

// Markdown configuration
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const markdownConfig = {
  files: ['**/*.md'],
  plugins: {
    markdown: markdownPlugin,
  },
  processor: 'markdown/markdown',
};

// Test configuration
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const testConfig = {
  files: ['**/*.test.{js,jsx,ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.jest,
    },
  },
  plugins: {
    'testing-library': testingLibraryPlugin,
  },
  settings: {},
  rules: {
    ...testingLibraryPlugin.configs['flat/react'].rules,
    '@typescript-eslint/unbound-method': 'off',
  },
};

// Node configuration
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const nodeConfig = {
  files: ['eslint.config.js', 'mocks/**/*.js'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
};

// Ignore patterns
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
const ignoresConfig = {
  ignores: [
    '**/node_modules/**/*', // Ensure all node_modules are ignored
    '**/build/*',
    '**/public/build/*',
    '**/dist/*',
    '**/dist-server/*',
    '**/coverage/*',
    '.specstory/*',
    '**/examples/*',
  ],
};

// Export the complete config using typescript-eslint's config function
/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config[]} */
const configs = [
  baseConfig,
  jsConfig,
  tsConfig,
  markdownTsConfig,
  markdownConfig,
  testConfig,
  nodeConfig,
  ignoresConfig,
];

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config[]} */
const combinedConfig = tseslint.config(...configs);

if (DEBUG) {
  console.info(combinedConfig);
}

export default combinedConfig;
