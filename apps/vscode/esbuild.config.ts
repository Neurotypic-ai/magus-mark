import esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const testOnly = process.argv.includes('--test');

const esbuildProblemMatcherPlugin: esbuild.Plugin = {
  name: 'esbuild-problem-matcher',
  setup(build: esbuild.PluginBuild) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result: esbuild.BuildResult) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location == null) return;
        console.error(`    ${location.file}:${location.line.toString()}:${location.column.toString()}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  // Build main extension
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
    plugins: [esbuildProblemMatcherPlugin],
  });

  // Build test files - bundle them to handle ES module dependencies
  const testCtx = await esbuild.context({
    entryPoints: ['src/**/*.test.ts', 'src/test/**/*.ts'],
    bundle: true, // Bundle to convert ES modules to CommonJS
    format: 'cjs',
    minify: false,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outdir: 'dist/test',
    outbase: 'src',
    external: ['vscode', '@vscode/test-electron', 'mocha', 'chai', 'sinon'],
    logLevel: 'info',
    plugins: [esbuildProblemMatcherPlugin],
  });

  // Add context for web extension if needed later, following VS Code docs
  // const webCtx = await esbuild.context({ ... });

  if (testOnly) {
    // Only build tests
    if (watch) {
      await testCtx.watch();
    } else {
      await testCtx.rebuild();
      await testCtx.dispose();
    }
  } else {
    // Build main extension and tests
    if (watch) {
      await ctx.watch();
      await testCtx.watch();
      // await webCtx.watch();
    } else {
      await ctx.rebuild();
      await testCtx.rebuild();
      // await webCtx.rebuild();
      await ctx.dispose();
      await testCtx.dispose();
      // await webCtx.dispose();
    }
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
