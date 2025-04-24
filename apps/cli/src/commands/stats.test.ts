import { beforeEach, describe, expect, it, vi } from 'vitest';

import { statsCommand } from './stats';

import type { ArgumentsCamelCase, Argv } from 'yargs';

import type { StatsOptions } from '../types/commands';

// Create direct mocks for the modules
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  box: vi.fn(),
  configure: vi.fn(),
};

const mockCostManager = {
  getUsageData: vi.fn().mockReturnValue({
    totalTokens: 1000,
    totalCost: 0.02,
    requests: 5,
    models: {
      'gpt-4o': { tokens: 500, cost: 0.01, requests: 2 },
      'gpt-3.5-turbo': { tokens: 500, cost: 0.01, requests: 3 },
    },
    lastUpdated: new Date().toISOString(),
  }),
  resetUsageData: vi.fn(),
  saveUsageData: vi.fn(),
};

const mockConfig = {
  get: vi.fn(),
  getAll: vi.fn().mockReturnValue({}),
};

// Mock the modules
vi.mock('@magus-mark/logger', () => ({ logger: mockLogger }));
vi.mock('@magus-mark/core', () => ({
  costManager: mockCostManager,
  config: mockConfig,
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
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    const builderFn = statsCommand.builder as (yargs: Argv) => Argv;
    builderFn(yargsInstance);

    expect(yargsInstance.option).toHaveBeenCalledWith('format', expect.any(Object));
    expect(yargsInstance.option).toHaveBeenCalledWith('reset', expect.any(Object));
  });

  it('should display usage statistics', async () => {
    // Call the handler with mock arguments
    const handlerFn = statsCommand.handler;
    await handlerFn({
      format: 'table',
      reset: false,
      _: ['stats'],
      $0: 'magus-mark',
    } as ArgumentsCamelCase<StatsOptions>);

    // Verify the correct methods were called
    expect(mockCostManager.getUsageData).toHaveBeenCalled();
    expect(mockLogger.box).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should reset usage statistics when reset flag is true', async () => {
    // Call the handler with reset flag
    const handlerFn = statsCommand.handler;
    await handlerFn({
      format: 'table',
      reset: true,
      _: ['stats'],
      $0: 'magus-mark',
    } as ArgumentsCamelCase<StatsOptions>);

    // Verify reset was called
    expect(mockCostManager.resetUsageData).toHaveBeenCalled();
    expect(mockCostManager.saveUsageData).toHaveBeenCalled();
  });

  it('should output JSON format when specified', async () => {
    // Call the handler with JSON format
    const handlerFn = statsCommand.handler;
    await handlerFn({
      format: 'json',
      reset: false,
      _: ['stats'],
      $0: 'magus-mark',
    } as ArgumentsCamelCase<StatsOptions>);

    // Verify JSON output
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('{'));
  });
});
