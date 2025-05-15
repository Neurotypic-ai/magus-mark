import esbuild from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

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

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
