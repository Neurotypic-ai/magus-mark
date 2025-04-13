import { describe, it, expect, vi, beforeEach } from 'vitest';
import { costManager } from './cost-manager';
import type { UsageData } from '../../src/types/cost';
import fs from 'fs-extra';

// Mock dependencies
vi.mock('../../src/utils/config', () => ({
  config: {
    get: vi.fn(),
    set: vi.fn()
  }
}));

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(JSON.stringify({
      totalTokens: 1000,
      totalCost: 0.02,
      requests: 5,
      models: {
        'gpt-4o': { tokens: 500, cost: 0.01, requests: 2 },
        'gpt-3.5-turbo': { tokens: 500, cost: 0.01, requests: 3 }
      },
      lastUpdated: new Date().toISOString()
    })),
    writeFileSync: vi.fn(),
    ensureFileSync: vi.fn()
  }
}));

describe('Cost Manager Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track token usage correctly', () => {
    // Record usage
    costManager.recordUsage({
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.003
    });
    
    // Get usage data
    const usage = costManager.getUsageData();
    
    // Verify
    expect(usage.totalTokens).toBeGreaterThanOrEqual(150);
    expect(usage.totalCost).toBeGreaterThanOrEqual(0.003);
    expect(usage.requests).toBeGreaterThanOrEqual(1);
    expect(usage.models['gpt-4o']).toBeDefined();
    expect(usage.models['gpt-4o'].tokens).toBeGreaterThanOrEqual(150);
    expect(usage.models['gpt-4o'].cost).toBeGreaterThanOrEqual(0.003);
    expect(usage.models['gpt-4o'].requests).toBeGreaterThanOrEqual(1);
  });

  it('should accumulate usage across multiple calls', () => {
    // Record first usage
    costManager.recordUsage({
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.003
    });
    
    // Record second usage with different model
    costManager.recordUsage({
      model: 'gpt-3.5-turbo',
      promptTokens: 200,
      completionTokens: 100,
      totalTokens: 300,
      cost: 0.001
    });
    
    // Get usage data
    const usage = costManager.getUsageData();
    
    // Verify totals
    expect(usage.totalTokens).toBeGreaterThanOrEqual(450); // 150 + 300
    expect(usage.totalCost).toBeGreaterThanOrEqual(0.004); // 0.003 + 0.001
    expect(usage.requests).toBeGreaterThanOrEqual(2);
    
    // Verify model-specific data
    expect(usage.models['gpt-4o']).toBeDefined();
    expect(usage.models['gpt-3.5-turbo']).toBeDefined();
    expect(usage.models['gpt-4o'].tokens).toBeGreaterThanOrEqual(150);
    expect(usage.models['gpt-3.5-turbo'].tokens).toBeGreaterThanOrEqual(300);
  });

  it('should reset usage data correctly', () => {
    // Record some usage
    costManager.recordUsage({
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.003
    });
    
    // Reset usage data
    costManager.resetUsageData();
    
    // Get usage data
    const usage = costManager.getUsageData();
    
    // Verify reset
    expect(usage.totalTokens).toBe(0);
    expect(usage.totalCost).toBe(0);
    expect(usage.requests).toBe(0);
    expect(Object.keys(usage.models)).toHaveLength(0);
  });

  it('should save usage data to disk', () => {
    // Record some usage
    costManager.recordUsage({
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.003
    });
    
    // Save usage data
    costManager.saveUsageData();
    
    // Verify file operations
    expect(fs.ensureFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('should load usage data from disk', () => {
    // Reset in-memory data
    costManager.resetUsageData();
    
    // Load usage data from disk (happens automatically in getUsageData)
    const usage = costManager.getUsageData();
    
    // Verify file read
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
    
    // Verify data loaded
    expect(usage.totalTokens).toBe(1000);
    expect(usage.totalCost).toBe(0.02);
    expect(usage.requests).toBe(5);
  });

  it('should estimate cost based on model and token count', () => {
    // GPT-4 models
    expect(costManager.estimateCost('gpt-4', 1000)).toBeCloseTo(0.03, 2);
    expect(costManager.estimateCost('gpt-4o', 1000)).toBeCloseTo(0.015, 2);
    
    // GPT-3.5 models
    expect(costManager.estimateCost('gpt-3.5-turbo', 1000)).toBeCloseTo(0.002, 2);
    
    // Unknown model should default to GPT-4 rates
    expect(costManager.estimateCost('unknown-model', 1000)).toBeCloseTo(0.03, 2);
  });

  it('should check if usage exceeds max cost', () => {
    // Reset to clean state
    costManager.resetUsageData();
    
    // Set maxCost to low value
    const maxCost = 0.01;
    
    // Record usage below limit
    costManager.recordUsage({
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.005
    });
    
    // Check if exceeds limit
    expect(costManager.exceedsMaxCost(maxCost)).toBe(false);
    
    // Record more usage to exceed limit
    costManager.recordUsage({
      model: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      cost: 0.006
    });
    
    // Check if exceeds limit now
    expect(costManager.exceedsMaxCost(maxCost)).toBe(true);
  });
});