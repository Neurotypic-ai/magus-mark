import esbuild from 'esbuild';

const production = process.argv.includes('--production');

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: production,
  sourcemap: !production,
  platform: 'neutral', // Suitable for libraries used in node/browser
  external: [], // Add external dependencies if needed
  logLevel: 'info',
};

Promise.all([
  esbuild.build({
    ...sharedConfig,
    format: 'esm',
    outfile: 'dist/index.esm.js',
  }),
  esbuild.build({
    ...sharedConfig,
    format: 'cjs',
    outfile: 'dist/index.cjs.js',
  }),
]).catch((error) => {
  console.error('Core package build failed:', error);
  process.exit(1);
});
