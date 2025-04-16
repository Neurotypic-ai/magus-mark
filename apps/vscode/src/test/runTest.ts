import * as path from 'path';

// import * as cp from 'child_process'; // Uncomment if needed for extension installation

import {
  downloadAndUnzipVSCode,
  // resolveCliArgsFromVSCodeExecutablePath, // Uncomment if needed for CLI tasks
  runTests,
} from '@vscode/test-electron';

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Download VS Code, unzip it and run the integration test
    const vscodeExecutablePath = await downloadAndUnzipVSCode('stable');

    // Example of using VS Code CLI for setup (uncomment if needed)
    // const [cliPath, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
    // cp.spawnSync(cliPath, [...args, '--install-extension', 'some-extension'], { encoding: 'utf-8', stdio: 'inherit' });

    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

// Run and handle the promise
void main();
