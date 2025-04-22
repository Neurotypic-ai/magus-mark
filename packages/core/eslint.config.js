import customConfig from 'eslint-config-custom';

export default [
  ...customConfig,

  // Core-specific overrides
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
];
