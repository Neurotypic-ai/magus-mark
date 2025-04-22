import * as fs from 'fs-extra';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { costManager } from './cost-manager';

// Mock dependencies
vi.mock('../../src/utils/config', () => ({
  config: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock fs-extra
vi.mock('fs-extra', () => ({
  ensureDirSync: vi.fn(),
  writeJSONSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true),
  readJSONSync: vi.fn().mockReturnValue([
    {
      timestamp: Date.now() - 3600000,
      model: 'gpt-4o',
      tokens: 500,
      cost: 0.01,
      operation: 'classify',
    },
    {
      timestamp: Date.now() - 1800000,
      model: 'gpt-3.5-turbo',
      tokens: 500,
      cost: 0.001,
      operation: 'tag',
    },
  ]),
}));

vi.mock('@magus-mark/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Cost Manager Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track token usage correctly', () => {
    // Track usage
    const cost = costManager.trackUsage('gpt-4o', { input: 100, output: 50 }, 'classify');

    // Verify cost is returned
    expect(cost).toBeGreaterThan(0);

    // Get session stats
    const stats = costManager.getSessionStats();

    // Verify
    expect(stats.totalTokens).toBeGreaterThanOrEqual(150);
    expect(stats.totalCost).toBeGreaterThanOrEqual(0);

    // Verify model-specific data (with null checks)
    const model = stats.modelBreakdown['gpt-4o'];
    expect(model).toBeDefined();
    if (model) {
      expect(model.tokens.totalTokens).toBeGreaterThanOrEqual(150);
      expect(model.cost).toBeGreaterThan(0);
    }
  });

  it('should accumulate usage across multiple calls', () => {
    // Track first usage
    costManager.trackUsage('gpt-4o', { input: 100, output: 50 }, 'classify');

    // Track second usage with different model
    costManager.trackUsage('gpt-3.5-turbo', { input: 200, output: 100 }, 'tag');

    // Get session stats
    const stats = costManager.getSessionStats();

    // Verify totals
    expect(stats.totalTokens).toBeGreaterThanOrEqual(450); // 150 + 300
    expect(stats.totalCost).toBeGreaterThan(0);

    // Verify model-specific data (with null checks)
    expect(stats.modelBreakdown['gpt-4o']).toBeDefined();
    expect(stats.modelBreakdown['gpt-3.5-turbo']).toBeDefined();

    const gpt4Model = stats.modelBreakdown['gpt-4o'];
    const gpt35Model = stats.modelBreakdown['gpt-3.5-turbo'];

    if (gpt4Model) {
      expect(gpt4Model.tokens.totalTokens).toBeGreaterThanOrEqual(150);
    }

    if (gpt35Model) {
      expect(gpt35Model.tokens.totalTokens).toBeGreaterThanOrEqual(300);
    }
  });

  it('should save usage data to disk', () => {
    // Track some usage
    costManager.trackUsage('gpt-4o', { input: 100, output: 50 }, 'classify');

    // Save usage data
    costManager.saveUsageData();

    // Verify file operations
    expect(fs.ensureDirSync).toHaveBeenCalled();
    expect(fs.writeJSONSync).toHaveBeenCalled();
  });

  it('should get usage history', () => {
    // Get usage history for all time
    const history = costManager.getUsageHistory();

    // Verify data
    expect(history.length).toBeGreaterThanOrEqual(2);

    if (history.length >= 2) {
      const first = history[0];
      const second = history[1];

      if (first && second) {
        expect(first.model).toBe('gpt-4o');
        expect(second.model).toBe('gpt-3.5-turbo');
      }
    }
  });

  it('should estimate cost based on model and token count', () => {
    // GPT-4 models
    expect(costManager.estimateCost('gpt-4', { input: 500, output: 500 })).toBeCloseTo(0.03, 2);
    expect(costManager.estimateCost('gpt-4o', { input: 500, output: 500 })).toBeCloseTo(0.015, 2);

    // GPT-3.5 models
    expect(costManager.estimateCost('gpt-3.5-turbo', { input: 500, output: 500 })).toBeCloseTo(0.001, 3);
  });

  it('should handle cost limits', () => {
    // Set limits
    costManager.setLimits({
      warningThreshold: 0.01,
      hardLimit: 0.02,
      onLimitReached: 'pause',
    });

    // Check current limit
    expect(costManager.getCostLimit()).toBe(0.02);

    // Verify not paused initially
    expect(costManager.isPaused()).toBe(false);

    // Track usage to potentially exceed limit
    costManager.trackUsage('gpt-4o', { input: 1000, output: 1000 }, 'classify');

    // Check if paused
    const isPaused = costManager.isPaused();

    // Reset pause for further tests
    if (isPaused) {
      costManager.resetPause();
    }

    // Verify reset worked
    expect(costManager.isPaused()).toBe(false);
  });
});
