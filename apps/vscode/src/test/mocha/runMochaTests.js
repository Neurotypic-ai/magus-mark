#!/usr/bin/env node

// Script to run Mocha tests for VS Code extension
// This is used as an alternative to using the VS Code test runner for unit tests

const Mocha = require('mocha');
const path = require('path');
const glob = require('glob');

async function run() {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000,
  });

  const testsRoot = path.resolve(__dirname, '../../');

  try {
    // Find all test files
    const files = await glob.glob('**/*.test.{js,ts}', {
      cwd: testsRoot,
      ignore: ['**/node_modules/**', '**/test/suite/**', '**/test/runTest.{js,ts}'],
    });

    // Add files to the test suite
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    // Run the tests
    mocha.run((failures) => {
      process.exitCode = failures > 0 ? 1 : 0;
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exitCode = 1;
  }
}

// Run the tests
run();
