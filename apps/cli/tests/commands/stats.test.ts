import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statsCommand } from '../../src/commands/stats';
import type { Argv, ArgumentsCamelCase  } from 'yargs';
import type { StatsOptions } from '../../src/types/commands';

// Mock dependencies
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    box: vi.fn(),
    configure: vi.fn()
  }
}));

vi.mock('../../src/utils/config', () => ({
  config: {
    get: vi.fn(),
    getAll: vi.fn().mockReturnValue({})
  }
}));

vi.mock('../../src/utils/cost-manager', () => ({
  costManager: {
    getUsageData: vi.fn().mockReturnValue({
      totalTokens: 1000,
      totalCost: 0.02,
      requests: 5,
      models: {
        'gpt-4o': { tokens: 500, cost: 0.01, requests: 2 },
        'gpt-3.5-turbo': { tokens: 500, cost: 0.01, requests: 3 }
      },
      lastUpdated: new Date().toISOString()
    }),
    resetUsageData: vi.fn(),
    saveUsageData: vi.fn()
  }
}));

describe('statsCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct command name and description', () => {
    expect(statsCommand.command).toBe('stats');
    expect(typeof statsCommand.describe).toBe('string');
  });

  it('should have the required options in builder', () => {
    const yargsInstance = {
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis()
    } as unknown as Argv;
    
    const builderFn = statsCommand.builder as (yargs: Argv) => Argv;
    expect(builderFn).toBeDefined();
    builderFn(yargsInstance);
    
    expect(yargsInstance.option).toHaveBeenCalledWith('format', expect.any(Object));
    expect(yargsInstance.option).toHaveBeenCalledWith('reset', expect.any(Object));
  });

  it('should display usage statistics', async () => {
    const { logger } = await import('../../src/utils/logger');
    const { costManager } = await import('../../src/utils/cost-manager');
    
    // Call the handler with mock arguments
    const handlerFn = statsCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'pretty',
      reset: false,
      _: ['stats'],
      $0: 'obsidian-magic'
    } as ArgumentsCamelCase<StatsOptions>);
    
    // Verify the correct methods were called
    expect(costManager.getUsageData).toHaveBeenCalled();
    expect(logger.box).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it('should reset usage statistics when reset flag is true', async () => {
    const { costManager } = await import('../../src/utils/cost-manager');
    
    // Call the handler with reset flag
    const handlerFn = statsCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'pretty',
      reset: true,
      _: ['stats'],
      $0: 'obsidian-magic'
    } as ArgumentsCamelCase<StatsOptions>);
    
    // Verify reset was called
    expect(costManager.resetUsageData).toHaveBeenCalled();
    expect(costManager.saveUsageData).toHaveBeenCalled();
  });

  it('should output JSON format when specified', async () => {
    const { logger } = await import('../../src/utils/logger');
    
    // Call the handler with JSON format
    const handlerFn = statsCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'json',
      reset: false,
      _: ['stats'],
      $0: 'obsidian-magic'
    } as ArgumentsCamelCase<StatsOptions>);
    
    // Verify JSON output
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('{'));
  });
}); 