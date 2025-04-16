import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatFiles, generateFiles, getWorkspaceLayout, names, offsetFromRoot } from '@nx/devkit';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function (tree, options) {
  const workspaceLayout = getWorkspaceLayout(tree);
  const appsDir = workspaceLayout.appsDir || 'apps';

  // Normalize options
  const normalizedOptions = normalizeOptions(tree, options, appsDir);

  // Get the correct template directory based on app type
  const templateDir = path.join(__dirname, 'files', normalizedOptions.type);

  // Check if template directory exists for the selected app type
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Template directory for ${normalizedOptions.type} does not exist: ${templateDir}`);
    return;
  }

  // Generate files
  generateFiles(tree, templateDir, normalizedOptions.projectRoot, normalizedOptions);

  await formatFiles(tree);

  // Output completion message
  console.log(`🔮 Generated new application: ${normalizedOptions.projectRoot}`);
  console.log(`  📂 Files created in: ${normalizedOptions.projectRoot}`);
  console.log(`  ⚡ Next steps:`);
  console.log(`    - Run: cd ${normalizedOptions.projectRoot} && pnpm install`);
  console.log(`    - Build: cd ${normalizedOptions.projectRoot} && pnpm build`);

  // App-specific instructions
  switch (normalizedOptions.type) {
    case 'cli':
      console.log(`    - Run: cd ${normalizedOptions.projectRoot} && pnpm start`);
      break;
    case 'vscode':
      console.log(`    - Debug: F5 in VS Code with Extension configuration selected`);
      break;
    case 'obsidian':
      console.log(`    - Launch Obsidian in developer mode and load the plugin`);
      break;
  }
}

function normalizeOptions(tree, options, appsDir) {
  const name = names(options.name).fileName;
  const projectDirectory = name;
  const projectName = name;
  const projectRoot = `${appsDir}/${projectDirectory}`;
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  return {
    ...options,
    name,
    projectName,
    projectRoot,
    tags: parsedTags.join(','),
    fileName: names(name).fileName,
    className: names(name).className,
    constantName: names(name).constantName,
    unitTestRunner: options.unitTestRunner || 'vitest',
    linter: options.linter || 'eslint',
    description: options.description || `An application for Obsidian Magic`,
  };
}
