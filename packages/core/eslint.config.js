import { createESLintConfig } from '@magus-mark/eslint-config';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config[]} */
export default createESLintConfig([
  /** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config[]} */
  {
    files: ['src/**/*.ts'],
    rules: {
      // Enforce API documentation with JSDoc
      'jsdoc/require-jsdoc': [
        'warn',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
          contexts: ['ExportDefaultDeclaration > ClassDeclaration', 'ExportNamedDeclaration > ClassDeclaration'],
        },
      ],
    },
  },
]);
