import { vi } from 'vitest';

import type { Mock } from 'vitest';

interface LoggerMockInstance {
  info: Mock;
  warn: Mock;
  error: Mock;
  debug: Mock;
  box: Mock;
  configure: Mock;
  [key: string]: Mock;
}

/**
 * Shared Logger mock for use in tests
 */
export const mockLoggerInstance: LoggerMockInstance = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  box: vi.fn(),
  configure: vi.fn(),
};

// Track if setup has already been called
let isSetup = false;

/**
 * Setup function to configure the Logger mock for tests
 * This needs to be called before any imports of the Logger module
 */
export function setupLoggerMock(): LoggerMockInstance {
  // Only setup once to avoid "Cannot redefine property" errors
  if (isSetup) {
    resetLoggerMock();
    return mockLoggerInstance;
  }

  // Call this before your tests and before importing the Logger
  vi.mock('@obsidian-magic/core/utils/Logger', () => {
    return {
      Logger: {
        getInstance: vi.fn(() => mockLoggerInstance),
      },
    };
  });

  isSetup = true;
  return mockLoggerInstance;
}

/**
 * Reset all mock functions between tests
 */
export function resetLoggerMock(): void {
  // Reset each mock function
  for (const key of Object.keys(mockLoggerInstance)) {
    const mockFn = mockLoggerInstance[key];
    if (mockFn && typeof mockFn.mockReset === 'function') {
      mockFn.mockReset();
    }
  }
}

/**
 * Manual implementation for tests that can't use automatic mocking
 */
export const manualLoggerMock = {
  Logger: {
    getInstance: vi.fn(() => mockLoggerInstance) as Mock<() => LoggerMockInstance>,
  },
};
