import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} */
export const testConfig = {
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
