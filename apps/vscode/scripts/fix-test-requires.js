#!/usr/bin/env node
/**
 * Fix require statements in compiled test files to use .cjs extension
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixRequiresInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix require statements: require('./file.js') -> require('./file.cjs')
  // Also handle require('./file') when the file exists as .cjs
  content = content.replace(/require\((['"])([^'"]+)\.js\1\)/g, (match, quote, filePath) => {
    return `require(${quote}${filePath}.cjs${quote})`;
  });
  
  // Fix require statements without extension that should be .cjs
  // This is a bit more complex - we'd need to check if the file exists
  // For now, just handle the .js case above
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function fixRequiresInDirectory(dir) {
  const files = execSync(`find "${dir}" -name "*.cjs" -type f`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  
  files.forEach(file => {
    fixRequiresInFile(file);
  });
}

const testDir = path.resolve(__dirname, '../dist/test');
if (fs.existsSync(testDir)) {
  fixRequiresInDirectory(testDir);
  console.log('Fixed require statements in test files');
} else {
  console.warn('Test directory not found:', testDir);
}

