const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'dist/test/**/*.test.js', // Point to compiled test files in dist
  // version: 'stable', // Optionally specify VS Code version
  // workspaceFolder: './sampleWorkspace', // Optionally specify a workspace
  extensionDevelopmentPath: '.', // Root of the extension package
  mocha: {
    ui: 'tdd',
    timeout: 20000,
    // Add any other mocha options needed
  },
});
