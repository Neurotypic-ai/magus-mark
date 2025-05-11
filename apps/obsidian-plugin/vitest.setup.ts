import { vi } from 'vitest';

// Mock window.require for tests needing electron access
if (typeof window !== 'undefined') {
  (window as unknown as { require: (module: string) => unknown }).require = vi.fn((module: string) => {
    if (module === 'electron') {
      // Return a basic mock for electron if needed
      return {
        ipcRenderer: {
          on: vi.fn(),
          send: vi.fn(),
        },
        // Add other electron mocks if required by tests
      };
    }
    // Optionally, you could try to actually require other modules
    // or just throw an error for anything else.
    // throw new Error(`Cannot find module '${module}' in test environment`);
    console.warn(`Attempted to require non-electron module in test: ${module}`);
    return {}; // Return empty object for other requires to avoid hard crashes
  });
}

// Any other global test setup can go here
