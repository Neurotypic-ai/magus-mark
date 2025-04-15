import { describe, expect, it } from 'vitest';

import type { RateLimitInfo } from './RateLimitInfo';

describe('RateLimitInfo', () => {
  it('validates rate limit info', () => {
    const resetTime = new Date();

    const rateLimitInfo: RateLimitInfo = {
      totalRequests: 100,
      remainingRequests: 75,
      resetTime,
    };

    expect(rateLimitInfo.totalRequests).toBe(100);
    expect(rateLimitInfo.remainingRequests).toBe(75);
    expect(rateLimitInfo.resetTime).toBe(resetTime);
  });
});
