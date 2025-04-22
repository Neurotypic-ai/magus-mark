import fs from 'fs';
import path from 'path';

import esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location == null) return;
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

/**
 * @type {import('esbuild').Plugin}
 */
const copyWasmPlugin = {
  name: 'copy-wasm-plugin',
  setup(build) {
    build.onEnd(() => {
      console.log('Copying tiktoken WebAssembly files to output directory...');
      try {
        // Find tiktoken in node_modules - use the workspace root
        const wasmSource = path.resolve(
          '../../node_modules/.pnpm/tiktoken@1.0.20/node_modules/tiktoken/tiktoken_bg.wasm'
        );
        const wasmDest = path.resolve('./dist/tiktoken_bg.wasm');

        // Ensure directory exists
        fs.mkdirSync(path.dirname(wasmDest), { recursive: true });

        // Copy the file
        fs.copyFileSync(wasmSource, wasmDest);
        console.log(`Copied WebAssembly file to: ${wasmDest}`);
      } catch (err) {
        console.error('Failed to copy WASM file:', err);
      }
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'], // Main extension entry point
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node', // For the nodejs runtime
    outfile: 'dist/extension.cjs',
    external: ['vscode'],
    logLevel: 'info',
    plugins: [esbuildProblemMatcherPlugin, copyWasmPlugin],
  });

  // Add context for web extension if needed later, following VS Code docs
  // const webCtx = await esbuild.context({ ... });

  if (watch) {
    await ctx.watch();
    // await webCtx.watch();
  } else {
    await ctx.rebuild();
    // await webCtx.rebuild();
    await ctx.dispose();
    // await webCtx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
