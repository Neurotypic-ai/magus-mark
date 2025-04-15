module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['core', 'cli', 'plugin', 'vscode', 'types', 'utils', 'docs', 'build', 'ci']],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
    'header-max-length': [0, 'always', 100],
  },
};
