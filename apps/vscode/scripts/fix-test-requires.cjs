#!/usr/bin/env node
/**
 * Fix require statements in compiled test files to use .cjs extension
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixRequiresInFile(filePath, dir) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix @magus-mark/core imports FIRST - before other replacements
  // Resolve to the actual built file path relative to the workspace root
  // __dirname is apps/vscode/scripts, so go up 3 levels to get to workspace root
  const workspaceRoot = path.resolve(__dirname, '../../..');
  const coreDistPath = path.join(workspaceRoot, 'packages/core/dist/src');
  
  // Debug: log the paths
  if (!fs.existsSync(coreDistPath)) {
    console.warn(`Core dist path not found: ${coreDistPath}`);
    console.warn(`Workspace root: ${workspaceRoot}`);
  }
  
  // Fix @magus-mark/core imports - convert to relative paths to built ES module files
  // We'll use dynamic import() in a wrapper since ES modules can't be required directly
  // But actually, we can't use dynamic import in CommonJS easily
  // So let's convert to relative paths and handle ES modules via a loader hook
  // Actually, the simplest is to convert to relative paths pointing to built files
  const workspaceRoot = path.resolve(__dirname, '../../..');
  const coreDistPath = path.join(workspaceRoot, 'packages/core/dist/src');
  
  // Fix @magus-mark/core imports - use wrapper files that handle ES modules
  // Calculate wrapper dir relative to dist/test (not the specific file)
  const distTestDir = path.join(path.dirname(filePath).split(path.sep + 'dist' + path.sep + 'test')[0], 'dist', 'test');
  const wrapperDir = path.join(distTestDir, 'core-wrappers');
  content = content.replace(/require\((['"])@magus-mark\/core\/([^'"]+?)(\.js)?\1\)/g, (match, quote, importPath) => {
    // Use wrapper file instead of direct ES module
    const wrapperName = importPath.replace(/\//g, '_');
    const wrapperPath = path.join(wrapperDir, `${wrapperName}.cjs`);
    if (!fs.existsSync(wrapperPath)) {
      console.warn(`Wrapper not found for ${importPath}, keeping original import`);
      return match;
    }
    // Use relative path from test file to wrapper
    const relativePath = path.relative(path.dirname(filePath), wrapperPath);
    const normalizedPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    return `require(${quote}${normalizedPath.replace(/\\/g, '/')}${quote})`;
  });
  
  // Fix require statements: require('./file.js') -> require('./file.cjs')
  // But skip if it's already been processed (contains packages/core)
  content = content.replace(/require\((['"])([^'"]+)\.js\1\)/g, (match, quote, filePath) => {
    // Skip if this is a core import (already processed) or node_modules
    if (filePath.includes('packages/core') || filePath.includes('node_modules')) {
      return match;
    }
    return `require(${quote}${filePath}.cjs${quote})`;
  });
  
  // Fix require statements without extension: require('./file') -> require('./file.cjs')
  // Only if the .cjs file exists
  const fileDir = path.dirname(filePath);
  content = content.replace(/require\((['"])([^'"]+?)\1\)/g, (match, quote, requirePath) => {
    // Skip if already has extension, is a node module, or is a core import
    if (requirePath.endsWith('.cjs') || requirePath.endsWith('.json') || requirePath.endsWith('.js') ||
        requirePath.includes('packages/core') || requirePath.includes('node_modules') ||
        (!requirePath.startsWith('.') && !requirePath.startsWith('@magus-mark/core'))) {
      return match;
    }
    
    // Resolve relative to the current file's directory
    const resolvedPath = path.resolve(fileDir, requirePath);
    const cjsPath = resolvedPath + '.cjs';
    const jsPath = resolvedPath + '.js';
    
    // Check for .cjs first, then .js (which should have been renamed to .cjs)
    if (fs.existsSync(cjsPath)) {
      return `require(${quote}${requirePath}.cjs${quote})`;
    }
    // Also check if there's a .js file that should be .cjs
    if (fs.existsSync(jsPath)) {
      return `require(${quote}${requirePath}.cjs${quote})`;
    }
    return match;
  });
  
  // Fix mocha imports - replace mocha_1.setup with global setup
  // The compiled code uses mocha_1.setup but mocha doesn't export setup as named export
  content = content.replace(/\(0,\s*mocha_1\.setup\)/g, 'setup');
  content = content.replace(/\(0,\s*mocha_1\.teardown\)/g, 'teardown');
  content = content.replace(/mocha_1\.suite/g, 'suite');
  content = content.replace(/mocha_1\.test/g, 'test');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function fixRequiresInDirectory(dir) {
  const files = glob.sync('**/*.cjs', { cwd: dir, absolute: true });
  
  files.forEach(file => {
    try {
      fixRequiresInFile(file, dir);
    } catch (error) {
      console.warn(`Failed to fix ${file}:`, error.message);
    }
  });
}

const testDir = path.resolve(__dirname, '../dist/test');
if (fs.existsSync(testDir)) {
  fixRequiresInDirectory(testDir);
  console.log('Fixed require statements in test files');
} else {
  console.warn('Test directory not found:', testDir);
}
