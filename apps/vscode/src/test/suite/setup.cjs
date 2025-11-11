/**
 * Mocha setup file - runs before all tests
 * Sets up the VS Code mock in the extension host context
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Load the VS Code mock
// From dist/test/test/suite/ we need to go up to dist/test/tests/
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vscodeMockPath = path.resolve(__dirname, '../../tests/vscode.cjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vscodeMock = require(vscodeMockPath);

// Make vscode globally available to tests
globalThis.vscode = vscodeMock;

// Make mocha TDD globals available
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { suite, test, setup: mochaSetup, teardown } = require('mocha');

// Expose mocha functions as globals for TDD mode
globalThis.suite = suite;
globalThis.test = test;
globalThis.setup = mochaSetup;
globalThis.teardown = teardown;

