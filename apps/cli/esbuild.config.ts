import { build } from 'esbuild';

// Build main CLI
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: false,
  sourcemap: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: 'dist/cli.js',
  external: [
    // Node.js built-ins
    'node:*',
    'fs',
    'path',
    'crypto',
    'util',
    'events',
    'stream',
    'buffer',
    'url',
    'tty',
    'os',

    // Dependencies that should remain external
    'yargs',
    'chalk',
    'ora',
    'blessed',
    'blessed-contrib',
    'yoctocolors-cjs',
    '@inquirer/prompts',
    'cli-progress',
    'js-yaml',
    'zod',
    'boxen',
    'update-notifier',
    'dotenv',
  ],
  banner: {
    js: '#!/usr/bin/env node\n',
  },
});

// Build demo CLI (standalone)
await build({
  entryPoints: ['src/demo-cli.ts'],
  bundle: true,
  minify: false,
  sourcemap: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outfile: 'dist/demo-cli.js',
  external: [
    // Node.js built-ins
    'node:*',
    'fs',
    'path',
    'crypto',
    'util',
    'events',
    'stream',
    'buffer',
    'url',
    'tty',
    'os',

    // Dependencies that should remain external
    'yargs',
  ],
  banner: {
    js: '#!/usr/bin/env node\n',
  },
});
