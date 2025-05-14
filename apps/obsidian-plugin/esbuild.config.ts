import { exec } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { context } from 'esbuild';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes('--watch');
const outdir = 'dist';

function installToDocs() {
  exec('node scripts/install-to-docs.js', (error, stdout, stderr) => {
    if (error) console.error(`Error installing to docs: ${error.message}`);
    if (stderr) console.error(`Install script stderr: ${stderr}`);
    if (stdout) console.log(`Install script stdout: ${stdout.trim()}`);
  });
}

function copyAssets() {
  // Create output directory
  mkdirSync(outdir, { recursive: true });
  console.log('[Magus Mark ESBuild] copyAssets: Output directory ensured.');

  // Copy standard files
  for (const file of ['manifest.json', 'styles.css']) {
    const sourcePath = resolve(__dirname, file);
    const destPath = resolve(__dirname, outdir, file);
    try {
      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, destPath);
        console.log(`[Magus Mark ESBuild] Copied ${file} from ${sourcePath} to ${destPath}`);
      } else {
        console.warn(`[Magus Mark ESBuild] Source file not found for copyAssets: ${sourcePath}`);
      }
    } catch (e: unknown) {
      if (e instanceof Error && 'code' in e && e.code !== 'ENOENT') throw e;
      else console.error(`[Magus Mark ESBuild] Error copying ${file}: ${String(e)}`);
    }
  }

  // Copy assets directory if it exists
  const assetsDir = resolve(__dirname, 'assets');
  const destAssetsDir = resolve(__dirname, outdir, 'assets');

  if (existsSync(assetsDir)) {
    console.log(`[Magus Mark ESBuild] Copying assets directory from ${assetsDir} to ${destAssetsDir}`);
  }

  // Copy WASM file to assets directory
  copyWasmToAssets();
}

// Copy WASM file to assets directory
function copyWasmToAssets() {
  try {
    // Create assets directory if it doesn't exist
    const assetsDir = resolve(__dirname, 'assets');
    mkdirSync(assetsDir, { recursive: true });

    // Create assets directory in dist if it doesn't exist
    const distAssetsDir = resolve(__dirname, outdir, 'assets');
    mkdirSync(distAssetsDir, { recursive: true });

    // Try to find the WASM file in node_modules
    const tiktokenPaths = [
      resolve(__dirname, '../../node_modules/.pnpm/tiktoken@1.0.21/node_modules/tiktoken/tiktoken_bg.wasm'),
      resolve(__dirname, '../../node_modules/tiktoken/tiktoken_bg.wasm'),
      resolve(__dirname, 'node_modules/tiktoken/tiktoken_bg.wasm'),
    ];

    // Find the first WASM file that exists
    const foundPath = tiktokenPaths.find((path) => existsSync(path));

    if (foundPath) {
      console.log(`[Magus Mark ESBuild] Found tiktoken_bg.wasm at: ${foundPath}`);

      // Copy to assets directory
      const assetsDest = resolve(assetsDir, 'tiktoken_bg.wasm');
      copyFileSync(foundPath, assetsDest);
      console.log(`[Magus Mark ESBuild] Copied tiktoken_bg.wasm to assets directory: ${assetsDest}`);

      // Copy to dist/assets directory
      const distAssetsDest = resolve(distAssetsDir, 'tiktoken_bg.wasm');
      copyFileSync(foundPath, distAssetsDest);
      console.log(`[Magus Mark ESBuild] Copied tiktoken_bg.wasm to dist/assets directory: ${distAssetsDest}`);

      return true;
    }

    console.error('[Magus Mark ESBuild] Could not find tiktoken_bg.wasm in any node_modules directory');
    return false;
  } catch (error: unknown) {
    console.error(
      '[Magus Mark ESBuild] Error copying tiktoken_bg.wasm:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

async function main() {
  try {
    const ctx = await context({
      entryPoints: [resolve(__dirname, 'src/main.ts')],
      bundle: true,
      outfile: resolve(__dirname, outdir, 'main.js'),
      platform: 'node',
      format: 'cjs',
      sourcemap: true,
      minify: !isWatch,
      external: ['obsidian'],
      banner: {
        js: '/* Magus Mark Obsidian Plugin - Bundled with ESBuild */',
      },
      absWorkingDir: resolve(__dirname),
    });

    if (isWatch) {
      await ctx.watch();
      console.log('[Magus Mark ESBuild] Initial build complete, watching for changes...');
    } else {
      await ctx.rebuild();
      console.log('[Magus Mark ESBuild] Build complete!');
      console.log(`[Magus Mark ESBuild] Output file: ${resolve(__dirname, outdir, 'main.js')}`);
      await ctx.dispose();
    }

    copyAssets();
    installToDocs();
  } catch (error) {
    console.error('[Magus Mark ESBuild] Build failed:', error);
    process.exit(1);
  }
}

await main();
