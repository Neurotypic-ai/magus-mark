import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import * as esbuild from 'esbuild';

const production = process.argv.includes('--production');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('esbuild').BuildOptions} */
const common = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  sourcemap: !production,
  minify: production,
  tsconfig: path.join(__dirname, 'tsconfig.json'),
  external: [
    // native/binary-heavy libs should be excluded
    '@duckdb/node-api',
    // keep vite out of the CLI bundle; it's imported dynamically at runtime
    'vite',
    'lightningcss',
    'fsevents',
  ],
  logLevel: 'info',
  loader: {
    '.sql': 'text',
  },
};

async function build() {
  await fs.promises.mkdir(path.join(__dirname, 'dist', 'bin'), { recursive: true });

  // CLI bin - bundle as CJS for best compatibility with shebang
  await esbuild.build({
    ...common,
    entryPoints: [path.join(__dirname, 'src/server/bin/typescript-viewer.ts')],
    outfile: path.join(__dirname, 'dist/bin/typescript-viewer.js'),
    format: 'cjs',
    banner: { js: '#!/usr/bin/env node' },
  });

  // API server (ESM is fine)
  await esbuild.build({
    ...common,
    entryPoints: [path.join(__dirname, 'src/server.ts')],
    outfile: path.join(__dirname, 'dist/server.js'),
    format: 'esm',
  });
}

void build();
