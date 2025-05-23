import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import esbuild from 'esbuild';

const production = process.argv.includes('--production');

// ES module equivalent of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type for the structure of package.json we care about
interface PackageJson {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

// Read and parse package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const pkg: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

// List all dependencies and peerDependencies as external
const external = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];

esbuild
  .build({
    entryPoints: ['src/index.ts'], // Your CLI entry point
    bundle: true,
    outfile: 'dist/cli.js',
    platform: 'node',
    target: 'node20', // Match your Node.js version
    format: 'esm', // ES modules for Node
    minify: production,
    sourcemap: !production,
    external: external, // Mark dependencies as external
    logLevel: 'info',
  })
  .catch((error: unknown) => {
    console.error('CLI build failed:', error);
    process.exit(1);
  });
