import path from 'path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import type { UserConfigExport } from 'vite';

const config: UserConfigExport = defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      // include: ['path', 'fs', 'util', 'process', 'buffer', 'stream', 'crypto'],
      globals: {
        process: true,
        Buffer: true,
      },
    }),
  ],
  server: {
    port: 4000,
    strictPort: true,
    hmr: {
      overlay: true,
      clientPort: 4000,
      host: 'localhost',
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'pinia'],
          'flow-vendor': ['@vue-flow/core', '@vue-flow/background', '@vue-flow/controls'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['vue', 'pinia', '@vue-flow/core', '@vue-flow/background', '@vue-flow/controls'],
  },
  resolve: {
    dedupe: ['vue'],
    alias: {
      vue: path.resolve(__dirname, 'node_modules/vue'),
    },
  },
  define: {
    'process.env': {},
    global: {},
    'process.version': JSON.stringify('v22.13.1'),
  },
});

export default config;
