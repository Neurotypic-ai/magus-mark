import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatFiles, generateFiles, getWorkspaceLayout, names, offsetFromRoot } from '@nx/devkit';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function (tree, options) {
  const workspaceLayout = getWorkspaceLayout(tree);
  const libsDir = workspaceLayout.libsDir || 'packages';

  // Normalize options
  const normalizedOptions = normalizeOptions(tree, options, libsDir);

  // Generate files
  generateFiles(tree, path.join(__dirname, 'files'), normalizedOptions.projectRoot, normalizedOptions);

  await formatFiles(tree);

  // Output completion message
  console.log(`🔮 Generated new library: ${normalizedOptions.projectRoot}`);
  console.log(`  📂 Files created in: ${normalizedOptions.projectRoot}`);
  console.log(`  ⚡ Next steps:`);
  console.log(`    - Run: cd ${normalizedOptions.projectRoot} && pnpm install`);
  console.log(`    - Build: cd ${normalizedOptions.projectRoot} && pnpm build`);
  console.log(`    - Import the library from other packages using: import { ... } from '${normalizedOptions.name}'`);
}

function normalizeOptions(tree, options, libsDir) {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory || name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${libsDir}/${projectDirectory}`;
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
    withReact: options.withReact || false,
    description: options.description || `A library for Magus Mark`,
  };
}
