import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const alias = { obsidian: resolve(__dirname, 'src/__mocks__/obsidian.ts') };

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'config/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
        'src/test/**',
        'src/__mocks__/**',
      ],
    },
  },
  resolve: {
    alias,
  },
});
