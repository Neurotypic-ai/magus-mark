import { defineConfig } from 'vitest/config';

/**
 * Template Vitest configuration to be used as a reference for all packages and apps.
 * Each package or app should extend this template and adjust as needed.
 */
export default defineConfig({
  test: {
    // Node environment for most tests
    environment: 'node',
    
    // Find all test files throughout the codebase
    include: ['**/*.{test,spec}.{ts,tsx}'],
    
    // Use global test functions (describe, it, expect) without importing
    globals: true,
    
    // Code coverage configuration
    coverage: {
      provider: 'istanbul', // More mature than c8
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      // Optional thresholds
      // thresholds: {
      //   statements: 80,
      //   branches: 70,
      //   functions: 80,
      //   lines: 80
      // }
    }
  }
}); 