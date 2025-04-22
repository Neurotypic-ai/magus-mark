import esbuild from 'esbuild';

const production = process.argv.includes('--production');

// Dynamically require package.json to get dependencies

const pkg = require('./package.json');

// List all dependencies and peerDependencies as external
const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];

esbuild
  .build({
    entryPoints: ['src/main.ts'], // Your CLI entry point
    bundle: true,
    outfile: 'dist/cli.js',
    platform: 'node',
    target: 'node20', // Match your Node.js version
    format: 'cjs', // CommonJS for Node
    minify: production,
    sourcemap: !production,
    external: external, // Mark dependencies as external
    logLevel: 'info',
  })
  .catch((error) => {
    console.error('CLI build failed:', error);
    process.exit(1);
  });
