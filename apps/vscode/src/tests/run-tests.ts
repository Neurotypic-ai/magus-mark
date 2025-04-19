/**
 * ESM-compatible test runner for VS Code extension tests
 * This handles setting up the VS Code mock and running Mocha tests
 */

import { existsSync, readdirSync, watch } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Mocha from 'mocha';

// Import the mock VS Code implementation
import vscodeMock from './vscode-mock';

// Set up filename and dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define a better global type for our mock
interface GlobalWithVSCode {
  vscode: typeof vscodeMock;
}

// Make vscode globally available to tests without imports
// This simulates how VS Code extension APIs are normally available
(globalThis as unknown as GlobalWithVSCode).vscode = vscodeMock;

/**
 * Find all test files
 */
function findTestFiles(baseDir: string): string[] {
  const testFiles: string[] = [];

  function scanDir(currentDir: string) {
    const files = readdirSync(currentDir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = join(currentDir, file.name);

      if (file.isDirectory() && !file.name.startsWith('node_modules')) {
        scanDir(fullPath);
      } else if (file.isFile() && file.name.endsWith('.test.ts') && !file.name.includes('run-tests')) {
        testFiles.push(fullPath);
      }
    }
  }

  scanDir(baseDir);
  return testFiles;
}

/**
 * Debounce function for file watching
 */
function debounce<F extends (...args: unknown[]) => void>(func: F, wait: number): (...args: Parameters<F>) => void {
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

/**
 * Check if a filename matches the test pattern
 */
function isTestFile(filenameInput: string | Buffer | null | undefined): boolean {
  if (!filenameInput) return false;

  try {
    // Convert Buffer to string if needed
    const filename =
      typeof filenameInput === 'string'
        ? filenameInput
        : Buffer.isBuffer(filenameInput)
          ? filenameInput.toString('utf8')
          : '';

    return filename.endsWith('.ts');
  } catch {
    return false;
  }
}

/**
 * Run the tests
 */
async function runTests(): Promise<void> {
  const testDir = join(__dirname, '..');
  const watchMode = process.argv.includes('--watch');

  // Configure Mocha
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: watchMode ? 0 : 10000,
  });

  try {
    // Find and add test files
    const testFiles = findTestFiles(testDir);

    console.log(`Found ${String(testFiles.length)} test files`);
    testFiles.forEach((file) => {
      mocha.addFile(file);
    });

    // Run the tests
    const failures = await new Promise<number>((resolve) => {
      mocha.run((failures) => {
        resolve(failures);
      });
    });

    if (!watchMode) {
      process.exitCode = failures ? 1 : 0;
    } else {
      console.log('\nWatching for file changes...');

      // Set up file watcher
      const watcher = watch(testDir, { recursive: true });

      // Define a debounced function to run tests
      const debouncedRun = debounce(() => {
        console.log('\nRerunning tests...');
        mocha.files = [];
        testFiles.forEach((file) => {
          if (existsSync(file)) {
            mocha.addFile(file);
          }
        });
        // No need to await this
        mocha.run();
        console.log('\nWatching for file changes...');
      }, 500);

      // Set up event handlers for file changes
      watcher.on('change', (_eventType, filename) => {
        if (isTestFile(filename)) {
          debouncedRun();
        }
      });

      // Keep the process alive
      process.stdin.resume();

      // Handle process termination
      process.on('SIGINT', () => {
        watcher.close();
        process.exit(0);
      });
    }
  } catch (error: unknown) {
    console.error('Error running tests:', error);
    process.exitCode = 1;
  }
}

// Run the tests
runTests().catch((err: unknown) => {
  console.error('Test runner failed:', err);
  process.exitCode = 1;
});
