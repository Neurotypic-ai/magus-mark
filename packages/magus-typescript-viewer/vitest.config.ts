import { defineConfig } from 'vitest/config';

import type { UserConfigExport } from 'vitest/config';

const config: UserConfigExport = defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});

export default config;
