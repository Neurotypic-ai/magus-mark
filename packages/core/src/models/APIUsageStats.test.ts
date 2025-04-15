import { describe, expect, it } from 'vitest';

import type { APIUsageStats } from './APIUsageStats';

describe('APIUsageStats', () => {
  it('validates API usage stats', () => {
    const stats: APIUsageStats = {
      totalTokens: 1250,
      promptTokens: 750,
      completionTokens: 500,
      cost: 0.025,
      currency: 'USD',
    };

    expect(stats.totalTokens).toBe(1250);
    expect(stats.promptTokens).toBe(750);
    expect(stats.completionTokens).toBe(500);
    expect(stats.cost).toBe(0.025);
    expect(stats.currency).toBe('USD');
  });
});
