import { cp, mkdir, readFile, rm } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the equivalent of __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const pluginDir = resolve(__dirname, '../');
  const manifestPath = resolve(pluginDir, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const pluginId = manifest.id;
  const distDir = resolve(pluginDir, 'dist');
  const destDir = resolve(pluginDir, '../../documentation/.obsidian/plugins', pluginId);

  // Remove previous installation if it exists
  await rm(destDir, { recursive: true, force: true });
  // Recreate plugin directory
  await mkdir(destDir, { recursive: true });

  // Copy manifest and styles
  for (const file of ['manifest.json', 'styles.css']) {
    await cp(resolve(pluginDir, file), resolve(destDir, file));
  }

  // Make sure we copy main.js with correct name
  const mainJsSource = resolve(distDir, 'main.js');
  const mainJsDest = resolve(destDir, 'main.js');
  await cp(mainJsSource, mainJsDest);

  // Copy any source maps or other files
  await cp(distDir, destDir, {
    recursive: true,
    filter: (src) => /\.(js\.map|css|json)$/i.test(src) && !src.endsWith('main.js'),
  });

  console.log(`Installed plugin ${pluginId} into documentation vault at ${destDir}`);
  console.log(`Main.js copied from ${mainJsSource} to ${mainJsDest}`);
}

main().catch((err) => {
  console.error('Error installing plugin to docs:', err);
  process.exit(1);
});
