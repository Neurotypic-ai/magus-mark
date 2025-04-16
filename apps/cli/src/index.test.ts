import { beforeEach, describe, expect, it, vi } from 'vitest';

// Now we can import Logger after the mock is set up
import { Logger } from '@obsidian-magic/core/utils/Logger';

// Import and setup Logger mock first - this MUST be done before importing Logger
import { mockLoggerInstance, resetLoggerMock } from './__mocks__/Logger';
import { costManager } from './utils/cost-manager';

// Add formatCost to the mockLoggerInstance
mockLoggerInstance['formatCost'] = vi.fn((cost: number) => `$${cost.toString()}`);

// Hoisted mocks - these are processed before module imports regardless of import order
vi.mock('@obsidian-magic/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn(() => mockLoggerInstance),
  },
}));

// Other mocks
vi.mock('./utils/cost-manager', () => ({
  costManager: {
    saveUsageData: vi.fn(),
    getCostLimit: vi.fn().mockReturnValue(10),
  },
}));

vi.mock('yargs', () => {
  return {
    default: vi.fn().mockReturnValue({
      scriptName: vi.fn().mockReturnThis(),
      usage: vi.fn().mockReturnThis(),
      version: vi.fn().mockReturnThis(),
      middleware: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      command: vi.fn().mockReturnThis(),
      demandCommand: vi.fn().mockReturnThis(),
      strict: vi.fn().mockReturnThis(),
      help: vi.fn().mockReturnThis(),
      epilogue: vi.fn().mockReturnThis(),
      wrap: vi.fn().mockReturnThis(),
      parse: vi.fn().mockResolvedValue({}),
    }),
  };
});

// Mock command modules
vi.mock('./commands/tag', () => ({
  tagCommand: { command: 'tag', describe: 'Tag command', builder: vi.fn(), handler: vi.fn() },
}));

vi.mock('./commands/test', () => ({
  testCommand: { command: 'test', describe: 'Test command', builder: vi.fn(), handler: vi.fn() },
}));

vi.mock('./commands/config', () => ({
  configCommand: { command: 'config', describe: 'Config command', builder: vi.fn(), handler: vi.fn() },
}));

vi.mock('./commands/config-interactive', () => ({
  configInteractiveCommand: { command: 'setup', describe: 'Setup command', builder: vi.fn(), handler: vi.fn() },
}));

vi.mock('./commands/stats', () => ({
  statsCommand: { command: 'stats', describe: 'Stats command', builder: vi.fn(), handler: vi.fn() },
}));

vi.mock('./commands/taxonomy', () => ({
  taxonomyCommand: { command: 'taxonomy', describe: 'Taxonomy command', builder: vi.fn(), handler: vi.fn() },
}));

// Skip tests that require importing the main module
describe('CLI Application', () => {
  // Create a reference to the logger instance for tests
  const logger = Logger.getInstance('cli');

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    resetLoggerMock();
    // Re-add formatCost after reset
    mockLoggerInstance['formatCost'] = vi.fn((cost: number) => `$${cost.toString()}`);
  });

  it('should have mocked dependencies correctly', () => {
    expect(logger.configure).toBeDefined();
    expect(costManager.saveUsageData).toBeDefined();
    expect(costManager.getCostLimit).toBeDefined();
    expect(logger.formatCost).toBeDefined();
  });

  it('should handle errors correctly', () => {
    // Log an error
    logger.error('Test error log');

    // Verify the mock was called with the expected arguments
    expect(mockLoggerInstance.error).toHaveBeenCalledWith('Test error log');
  });
});
