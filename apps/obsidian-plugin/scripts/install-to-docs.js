import { existsSync } from 'fs';
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

  // Copy tiktoken_bg.wasm file
  // First try to find it in the dist directory
  let tiktokenWasmSource = resolve(distDir, 'tiktoken_bg.wasm');
  if (!existsSync(tiktokenWasmSource)) {
    // If not in dist, check various possible locations
    const possiblePaths = [
      resolve(pluginDir, 'node_modules/@dqbd/tiktoken/tiktoken_bg.wasm'),
      resolve(pluginDir, '../../node_modules/@dqbd/tiktoken/tiktoken_bg.wasm'),
      resolve(pluginDir, '../../node_modules/.pnpm/tiktoken@1.0.21/node_modules/tiktoken/tiktoken_bg.wasm'),
      resolve(pluginDir, '../../node_modules/tiktoken/tiktoken_bg.wasm'),
      resolve(pluginDir, '../../apps/vscode/dist/tiktoken_bg.wasm'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        tiktokenWasmSource = path;
        break;
      }
    }
  }

  if (existsSync(tiktokenWasmSource)) {
    const tiktokenWasmDest = resolve(destDir, 'tiktoken_bg.wasm');
    await cp(tiktokenWasmSource, tiktokenWasmDest);
    console.log(`Copied tiktoken_bg.wasm from ${tiktokenWasmSource} to ${tiktokenWasmDest}`);

    // Double check file exists and has content
    if (existsSync(tiktokenWasmDest)) {
      const stats = await import('fs/promises').then((fs) => fs.stat(tiktokenWasmDest));
      console.log(`WASM file size: ${stats.size} bytes`);
    } else {
      console.error('WASM file missing after copy operation!');
    }
  } else {
    console.error('Could not find tiktoken_bg.wasm file. Plugin may not work correctly.');
  }

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
