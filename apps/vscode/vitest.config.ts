import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['../../config/vitest/setup-react.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['config/**', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
  },
});
