import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
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
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'flow-vendor': ['@xyflow/react', '@xyflow/system'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@xyflow/react',
      '@xyflow/system',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  define: {
    'process.env': {},
    global: {},
    'process.version': JSON.stringify('v22.13.1'),
  },
});
