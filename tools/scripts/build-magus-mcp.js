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
// const binOutputDir = path.join(__dirname, '..', '..', 'node_modules', '.bin'); // Old path
const binOutputDir = path.join(__dirname, '..', '..', 'bin'); // New path: projectRoot/bin
const rootDir = path.join(__dirname, '..', '..');

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

// Ensure Go workspace is properly initialized
try {
  // Check if go.mod exists in the magusMcpDir
  if (!fs.existsSync(path.join(magusMcpDir, 'go.mod'))) {
    log('go.mod not found in tools/magus-mcp, initializing a new module');
    execSync(`cd "${magusMcpDir}" && go mod init github.com/neurotypic-ai/magus-mark/tools/magus-mcp`, {
      stdio: 'inherit',
      shell: true,
    });
  }

  // Check if go.work exists in the root directory
  if (!fs.existsSync(path.join(rootDir, 'go.work'))) {
    log('go.work not found, initializing workspace');
    execSync(`cd "${rootDir}" && go work init && go work use ./tools/magus-mcp`, {
      stdio: 'inherit',
      shell: true,
    });
  } else {
    // Ensure tools/magus-mcp is in go.work
    try {
      const goWorkContent = fs.readFileSync(path.join(rootDir, 'go.work'), 'utf8');
      if (!goWorkContent.includes('./tools/magus-mcp')) {
        log('Adding tools/magus-mcp to go.work');
        execSync(`cd "${rootDir}" && go work use ./tools/magus-mcp`, {
          stdio: 'inherit',
          shell: true,
        });
      }
    } catch (error) {
      log(`Warning: Couldn't validate go.work content: ${error.message}`);
    }
  }
} catch (error) {
  log(`Warning: Error initializing Go workspace: ${error.message}`);
  // Continue anyway - this is a warning, not fatal
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

  // Copy to the new binOutputDir (projectRoot/bin/)
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
  log('magus-mcp is now ready to use from the /bin directory!');
} catch (error) {
  errorExit(`Build or copy failed: ${error.message}`);
}
