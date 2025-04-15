import { describe, expect, it } from 'vitest';

import type { APIRequestTracking } from './APIRequestTracking';

describe('APIRequestTracking', () => {
  it('validates API request tracking', () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2000); // 2 seconds later

    const tracking: APIRequestTracking = {
      requestId: 'req-123',
      model: 'gpt-4o',
      startTime,
      endTime,
      status: 'success',
      usage: {
        totalTokens: 1250,
        promptTokens: 750,
        completionTokens: 500,
        cost: 0.025,
        currency: 'USD',
      },
    };

    expect(tracking.requestId).toBe('req-123');
    expect(tracking.model).toBe('gpt-4o');
    expect(tracking.startTime).toBe(startTime);
    expect(tracking.endTime).toBe(endTime);
    expect(tracking.status).toBe('success');
    expect(tracking.usage).toBeDefined();
    if (tracking.usage) {
      expect(tracking.usage.totalTokens).toBe(1250);
    }
  });
});
