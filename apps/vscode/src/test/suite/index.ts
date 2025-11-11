/**
 * Test suite entry point for VS Code extension tests
 * This file sets up the VS Code mock before tests run
 */

// Import and set up VS Code mock before any tests are loaded
// Use CommonJS require since we're compiling to CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Load the VS Code mock (CommonJS file)
// From dist/test/test/suite/ we need to go up to dist/test/tests/
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vscodeMockPath = path.resolve(__dirname, '../../tests/vscode.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vscodeMock = require(vscodeMockPath);

// Make vscode globally available to tests
// This simulates how VS Code extension APIs are normally available
(globalThis as { vscode?: typeof vscodeMock }).vscode = vscodeMock;

