import { describe, expect, it } from 'vitest';

import type { BatchTaggingJob } from './BatchTaggingJob';

describe('BatchTaggingJob', () => {
  it('validates batch tagging job', () => {
    const job: BatchTaggingJob = {
      id: 'batch-job-1',
      documents: ['doc-1', 'doc-2', 'doc-3'],
      options: {
        model: 'gpt-4o',
        behavior: 'append',
        minConfidence: 0.6,
        reviewThreshold: 0.8,
        generateExplanations: true,
      },
      status: 'processing',
      progress: {
        total: 3,
        completed: 1,
        failed: 0,
      },
      stats: {
        startTime: new Date(),
        totalTokens: 1500,
        totalCost: 0.03,
        currency: 'USD',
      },
    };

    expect(job.id).toBe('batch-job-1');
    expect(job.documents).toHaveLength(3);
    expect(job.options.model).toBe('gpt-4o');
    expect(job.status).toBe('processing');
    expect(job.progress.completed).toBe(1);
    expect(job.stats).toBeDefined();
    if (job.stats) {
      expect(job.stats.totalTokens).toBe(1500);
      expect(job.stats.totalCost).toBe(0.03);
    }
  });
});
