/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  bracketSpacing: true,
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  printWidth: 120,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-sql', 'prettier-plugin-tailwindcss'],

  // Import sorting configuration
  importOrder: [
    '^node:(.*)$',
    '<BUILTIN_MODULES>',
    '^react(.*)$',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@neurotypicai/(.*)$',
    '',
    '^(#app|#tests|@/icon-name)(/.*)$',
    '',
    '^[./]',
    '^[../]',
    '',
    '<TYPES>',
    '',
    '<TYPES>^[.]',
    '',
    '(.css|.scss|.sass|.less|.styl)$',
  ],
  importOrderCaseSensitive: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],

  // SQL Plugin configuration
  formatter: 'sql-formatter',
  keywordCase: 'upper',
  identifierCase: 'lower',
  language: 'postgresql',

  overrides: [
    {
      files: ['*.json', '*.code-workspace'],
      options: {
        quoteProps: 'as-needed',
        singleQuote: false,
        trailingComma: 'none',
      },
    },
  ],
};

export default config;
