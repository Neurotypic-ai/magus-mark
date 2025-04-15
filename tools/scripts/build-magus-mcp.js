#!/usr/bin/env node

// Script to build magus-mcp binaries and copy them to node_modules/.bin
// Handles cross-platform compatibility
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const magusMcpDir = path.join(__dirname, '..', '..', 'tools', 'magus-mcp');
const binOutputDir = path.join(__dirname, '..', '..', 'node_modules', '.bin');

function log(message) {
  console.log(`[magus-mcp build] ${message}`);
}

function errorExit(message) {
  console.error(`[magus-mcp build] ERROR: ${message}`);
  process.exit(1);
}

// Check if Go is installed
try {
  execSync('go version', { stdio: 'pipe' });
  log('Go is installed, proceeding with build');
} catch (error) {
  errorExit(`Go is not installed or not in PATH. Please install Go to build magus-mcp. Error: ${error.message}`);
}

// Ensure output directory exists
try {
  if (!fs.existsSync(binOutputDir)) {
    fs.mkdirSync(binOutputDir, { recursive: true });
    log(`Created directory: ${binOutputDir}`);
  }
} catch (error) {
  errorExit(`Failed to create bin directory: ${error.message}`);
}

// Build the binary
try {
  const binaryName = isWindows ? 'magus-mcp.exe' : 'magus-mcp';
  log(`Building ${binaryName} in ${magusMcpDir}`);

  execSync(`cd "${magusMcpDir}" && go build -o ${binaryName}`, {
    stdio: 'inherit',
    shell: true,
  });

  log(`Successfully built ${binaryName}`);

  // Copy to node_modules/.bin
  const source = path.join(magusMcpDir, binaryName);
  const destination = path.join(binOutputDir, binaryName);

  if (isWindows) {
    // On Windows, use copy command
    execSync(`copy "${source.replace(/\//g, '\\')}" "${destination.replace(/\//g, '\\')}"`, {
      stdio: 'inherit',
      shell: true,
    });
  } else {
    // On Unix-like systems, use cp and make executable
    execSync(`cp "${source}" "${destination}" && chmod +x "${destination}"`, {
      stdio: 'inherit',
      shell: true,
    });
  }

  log(`Successfully copied ${binaryName} to ${binOutputDir}`);
  log('magus-mcp is now ready to use!');
} catch (error) {
  errorExit(`Build or copy failed: ${error.message}`);
}
