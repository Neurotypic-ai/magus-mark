import { cp, mkdir, readFile, rm } from 'fs/promises';
import { resolve } from 'path';

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

  // Copy all JavaScript, CSS, and JSON files from dist
  await cp(distDir, destDir, {
    recursive: true,
    filter: (src) => /\.(js|css|json)$/i.test(src),
  });

  console.log(`Installed plugin ${pluginId} into documentation vault at ${destDir}`);
}

main().catch((err) => {
  console.error('Error installing plugin to docs:', err);
  process.exit(1);
});
