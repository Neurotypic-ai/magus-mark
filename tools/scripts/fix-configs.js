#!/usr/bin/env node
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Main function to fix any configuration issues
 */
async function main() {
  try {
    console.log('Fixing project configurations...');

    // Get all project directories
    const appDirs = await getDirectories(path.join(rootDir, 'apps'));
    const packageDirs = await getDirectories(path.join(rootDir, 'packages'));

    // Combine all projects
    const allProjects = [
      ...appDirs.map((dir) => ({ path: path.join(rootDir, 'apps', dir), type: 'app' })),
      ...packageDirs.map((dir) => ({ path: path.join(rootDir, 'packages', dir), type: 'package' })),
    ];

    // Fix each project
    for (const project of allProjects) {
      await fixProjectPackageJson(project.path, project.type);
    }

    console.log('All configurations fixed successfully!');
  } catch (error) {
    console.error('Error fixing configurations:', error);
    process.exit(1);
  }
}

/**
 * Get all directories within a directory
 */
async function getDirectories(source) {
  const entries = await fs.readdir(source, { withFileTypes: true });
  return entries.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
}

/**
 * Fix package.json for a project
 */
async function fixProjectPackageJson(projectPath, projectType) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  try {
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    let modified = false;

    // Make sure devDependencies exists
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
      modified = true;
    }

    // Add @magus-mark/eslint-config if missing
    if (!packageJson.devDependencies['@magus-mark/eslint-config']) {
      packageJson.devDependencies['@magus-mark/eslint-config'] = 'workspace:*';
      modified = true;
    }

    // Add @magus-mark/typescript-config if missing
    if (!packageJson.devDependencies['@magus-mark/typescript-config']) {
      packageJson.devDependencies['@magus-mark/typescript-config'] = 'workspace:*';
      modified = true;
    }

    if (modified) {
      console.log(`Fixing package.json in ${projectPath}`);

      // Sort dependencies alphabetically
      if (packageJson.devDependencies) {
        packageJson.devDependencies = sortObjectKeys(packageJson.devDependencies);
      }

      // Write updated package.json with proper formatting
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    }
  } catch (error) {
    // Skip if package.json doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Sort object keys alphabetically
 */
function sortObjectKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

main();
