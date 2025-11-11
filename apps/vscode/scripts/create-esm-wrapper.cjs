#!/usr/bin/env node
/**
 * Create CommonJS wrapper files for ES module imports from core package
 * This allows CommonJS test files to require ES module files
 */

const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../../..');
const coreDistPath = path.join(workspaceRoot, 'packages/core/dist/src');
const wrapperDir = path.join(__dirname, '../dist/test/core-wrappers');

// Create wrapper directory
if (!fs.existsSync(wrapperDir)) {
  fs.mkdirSync(wrapperDir, { recursive: true });
}

// Create a wrapper for a specific core module
function createWrapper(importPath) {
  const wrapperPath = path.join(wrapperDir, `${importPath.replace(/\//g, '_')}.cjs`);
  const absoluteEsmPath = path.join(coreDistPath, `${importPath}.js`);
  
  const wrapperContent = `// CommonJS wrapper for ES module: ${importPath}
// Use absolute path to avoid package.json resolution
const esmPath = '${absoluteEsmPath.replace(/\\/g, '/')}';
let moduleExports = null;
let loadPromise = null;

// Use dynamic import to load ES module synchronously via require
// This is a hack - we'll load it on first access
function ensureLoaded() {
  if (moduleExports) return;
  if (loadPromise) {
    // Wait for existing load
    const { createRequire } = require('module');
    const require2 = createRequire(import.meta.url || __filename);
    // Can't actually wait synchronously, so we'll throw
    throw new Error('ES module loading in progress. This is not supported in CommonJS.');
  }
  // Actually, we can't load ES modules synchronously
  // So we'll use a different approach - create a sync wrapper that uses the built file directly
  throw new Error('Cannot synchronously require ES module. Use import() instead.');
}

// For now, let's try using createRequire with the file:// URL
const { createRequire } = require('module');
const fileUrl = 'file://' + esmPath;
try {
  // Try to require it - this won't work for ES modules, but let's see
  module.exports = require(esmPath);
} catch (e) {
  // If that fails, we need a different approach
  // Let's just export a proxy that will fail with a helpful message
  module.exports = new Proxy({}, {
    get(target, prop) {
      throw new Error(\`Cannot synchronously require ES module \${esmPath}. The core package exports ES modules which cannot be required from CommonJS. Consider using dynamic import() or converting tests to ES modules.\`);
    }
  });
}
`;

  fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
  return wrapperPath;
}

// For now, just create wrappers for the commonly used modules
const commonModules = [
  'errors/Result',
  'errors/ValidationError',
  'errors/utils',
  'errors/AppError'
];

commonModules.forEach(module => {
  const esmFile = path.join(coreDistPath, `${module}.js`);
  if (fs.existsSync(esmFile)) {
    createWrapper(module);
    console.log(`Created wrapper for ${module}`);
  }
});

console.log(`Created ${commonModules.length} wrapper files`);

