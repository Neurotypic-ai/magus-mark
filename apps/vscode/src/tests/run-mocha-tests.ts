/**
 * Custom Mocha test runner for VS Code extension tests
 * This handles module mocking and test setup for ESM
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import Mocha from 'mocha';

import mockVSCode from './mocha-setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a comprehensive mock for VS Code API as a global
// This can be used directly without import if needed
(globalThis as Record<string, unknown>)['vscode'] = mockVSCode;

/**
 * Run the Mocha tests
 */
async function run(): Promise<void> {
  // Create Mocha instance
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000,
  });

  // Check if we're in watch mode
  const watchMode = process.argv.includes('--watch');
  if (watchMode) {
    mocha.options.timeout = 0; // Disable timeouts in watch mode
  }

  try {
    // Get all test files
    const testDir = path.join(__dirname, '..');
    const testFiles = findTestFiles(testDir);

    // Filter out the old test files from src/test/suite directory
    // We're using our new test files in src/ directly
    const filteredTestFiles = testFiles.filter((file) => !file.includes('/test/suite/'));

    console.log('Found test files:', filteredTestFiles);

    // Add files to the test suite
    filteredTestFiles.forEach((file) => {
      mocha.addFile(file);
    });

    // Run tests and exit with appropriate code
    await new Promise<void>((resolve) => {
      mocha.run((failures) => {
        if (watchMode) {
          console.log('\nWatching for changes...');
        } else {
          process.exitCode = failures ? 1 : 0;
        }
        resolve();
      });
    });

    if (watchMode) {
      // Set up file watching for re-running tests
      fs.watch(
        testDir,
        { recursive: true },
        debounce((eventType: string, filename: string | null) => {
          console.log('watch', eventType, filename);
          if (filename?.endsWith('.ts')) {
            console.log(`\nFile ${filename} changed, re-running tests...`);
            mocha.files = [];
            filteredTestFiles.forEach((file) => mocha.addFile(file));
            void mocha.run();
          }
        }, 500)
      );
    }
  } catch (err) {
    console.error('Error running tests:', err);
    process.exitCode = 1;
  }
}

/**
 * Find all test files in the directory
 */
function findTestFiles(dir: string): string[] {
  const testFiles: string[] = [];

  function scanDir(currentDir: string) {
    try {
      const files = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(currentDir, file.name);

        if (file.isDirectory() && !file.name.startsWith('node_modules')) {
          scanDir(fullPath);
        } else if (file.isFile() && file.name.endsWith('.test.ts') && !file.name.includes('run-mocha-tests')) {
          testFiles.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`Error scanning directory ${currentDir}:`, err);
    }
  }

  scanDir(dir);
  return testFiles;
}

/**
 * Debounce function for the file watcher
 */
function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<F>): void {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Run the tests
void run();
