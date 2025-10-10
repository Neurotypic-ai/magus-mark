import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BatchPipeline } from './BatchPipeline';

import type { PipelineConfig, PipelineStage } from './BatchPipeline';

vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

describe('BatchPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('processes inputs through multiple stages', async () => {
    const config: PipelineConfig = {
      name: 'test-pipeline',
      concurrency: 2,
      retryDelay: 100,
      timeout: 5000,
      stopOnError: false,
    };

    const pipeline = new BatchPipeline<number, string>(config);

    const stage1: PipelineStage<number, number> = {
      name: 'double',
      description: 'Double the value',
      processor: async (input) => input * 2,
    };

    const stage2: PipelineStage<number, string> = {
      name: 'stringify',
      description: 'Convert to string',
      processor: async (input) => `result:${input}`,
    };

    pipeline.addStage(stage1);
    pipeline.addStage(stage2);

    const results = await pipeline.process([1, 2, 3]);

    expect(results).toEqual(['result:2', 'result:4', 'result:6']);
  });

  it('retries failing stages up to maxRetries', async () => {
    const config: PipelineConfig = {
      name: 'retry-pipeline',
      concurrency: 1,
      retryDelay: 10,
      timeout: 5000,
      stopOnError: false,
    };

    const pipeline = new BatchPipeline<number, number>(config);

    let attempts = 0;
    const flakyStage: PipelineStage<number, number> = {
      name: 'flaky',
      description: 'Flaky stage',
      retryCount: 2,
      processor: async (input) => {
        attempts++;
        if (attempts < 2) throw new Error('fail');
        return input * 2;
      },
    };

    pipeline.addStage(flakyStage);

    const results = await pipeline.process([5]);
    expect(results).toEqual([10]);
    expect(attempts).toBe(2);
  });

  it('tracks stats correctly', async () => {
    const config: PipelineConfig = {
      name: 'stats-pipeline',
      concurrency: 2,
      retryDelay: 10,
      timeout: 5000,
      stopOnError: false,
    };

    const pipeline = new BatchPipeline<number, number>(config);

    const stage: PipelineStage<number, number> = {
      name: 'identity',
      description: 'Identity',
      processor: async (input) => {
        if (input === 2) throw new Error('fail');
        return input;
      },
    };

    pipeline.addStage(stage);

    await pipeline.process([1, 2, 3]);

    const stats = pipeline.getStats();
    expect(stats.processed).toBe(3);
    expect(stats.successful).toBe(2);
    expect(stats.failed).toBe(1);
  });
});
