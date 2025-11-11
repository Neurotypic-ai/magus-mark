const { defineConfig } = require('@vscode/test-cli');
const path = require('path');
const fs = require('fs');

// Set up VS Code mock before tests run
// Load the mock directly here to avoid ES module issues
try {
  const vscodeMockPath = path.resolve(__dirname, 'dist/test/tests/vscode.cjs');
  if (fs.existsSync(vscodeMockPath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vscodeMock = require(vscodeMockPath);
    globalThis.vscode = vscodeMock;
  }
} catch (error) {
  console.warn('Could not load VS Code mock:', error.message);
}

module.exports = defineConfig({
  files: 'dist/test/**/*.test.cjs', // Point to compiled test files in dist
  // version: 'stable', // Optionally specify VS Code version
  // workspaceFolder: './sampleWorkspace', // Optionally specify a workspace
  extensionDevelopmentPath: '.', // Root of the extension package
  mocha: {
    ui: 'tdd',
    timeout: 20000,
    require: [path.resolve(__dirname, 'dist/test/test/suite/setup.cjs')], // Require setup file first
    // Add any other mocha options needed
  },
});
