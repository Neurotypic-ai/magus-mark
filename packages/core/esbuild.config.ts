import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import * as esbuild from 'esbuild';

import type { BuildOptions } from 'esbuild';

const production = process.argv.includes('--production');

// ES module equivalent of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse package.json to get externals
interface PackageJson {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}
const packageJsonPath = path.join(__dirname, 'package.json');
const pkg: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

const externalPackages = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];

// Base config, excluding format-specific options
const baseConfig: Omit<BuildOptions, 'format' | 'outfile'> = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: production,
  sourcemap: !production,
  platform: 'neutral',
  external: externalPackages,
  logLevel: 'info',
  mainFields: ['module', 'main'],
  target: 'es2020',
  tsconfig: path.join(__dirname, 'tsconfig.json'),
};

async function build() {
  try {
    await Promise.all([
      esbuild.build({
        ...baseConfig,
        format: 'esm',
        outfile: 'dist/index.esm.js',
      }),
      esbuild.build({
        ...baseConfig,
        format: 'cjs',
        outfile: 'dist/index.cjs.js',
      }),
    ]);
    console.log('Core package build successful.');
  } catch (error) {
    console.error('Core package build failed:', error);
    process.exit(1);
  }
}

void build();
