#!/usr/bin/env node
/**
 * Fix ES module imports in core package built files to include .js extensions
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix relative imports: from './AppError' -> from './AppError.js'
  // But only if the target file exists
  const fileDir = path.dirname(filePath);
  
  content = content.replace(/from\s+(['"])(\.\/[^'"]+?)(\1)/g, (match, quote, importPath) => {
    // Skip if already has extension
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match;
    }
    
    // Check if the target file exists
    const targetFile = path.join(fileDir, `${importPath}.js`);
    if (fs.existsSync(targetFile)) {
      modified = true;
      return `from ${quote}${importPath}.js${quote}`;
    }
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function fixImportsInDirectory(dir) {
  const files = glob.sync('**/*.js', { 
    cwd: dir, 
    absolute: true,
    ignore: ['**/*.test.js', '**/*.d.ts', '**/*.map']
  });
  
  files.forEach(file => {
    try {
      fixImportsInFile(file);
    } catch (error) {
      console.warn(`Failed to fix ${file}:`, error.message);
    }
  });
  
  console.log(`Fixed imports in ${files.length} core package files`);
}

const workspaceRoot = path.resolve(__dirname, '../../..');
const coreDistPath = path.join(workspaceRoot, 'packages/core/dist/src');

if (fs.existsSync(coreDistPath)) {
  fixImportsInDirectory(coreDistPath);
} else {
  console.warn('Core dist path not found:', coreDistPath);
}

