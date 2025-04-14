import { describe, expect, it } from 'vitest';

import { APIError } from './APIError';
import { AppError } from './AppError';

describe('APIError', () => {
  it('should create APIError with correct properties', () => {
    const error = new APIError('Rate limit exceeded', {
      statusCode: 429,
      retryAfter: 30,
      code: 'RATE_LIMIT_EXCEEDED',
    });
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(30);
    expect(error.recoverable).toBe(true);
    expect(error.isRateLimit()).toBe(true);
    expect(error.isServerError()).toBe(false);
    expect(error instanceof AppError).toBe(true);
  });

  it('should handle rate limit info', () => {
    const now = new Date();
    const reset = new Date(now.getTime() + 60000);

    const error = new APIError('Rate limit exceeded', {
      statusCode: 429,
      rateLimitInfo: {
        limit: 100,
        remaining: 0,
        reset,
      },
    });

    expect(error.rateLimitInfo?.limit).toBe(100);
    expect(error.rateLimitInfo?.remaining).toBe(0);
    expect(error.rateLimitInfo?.reset).toBe(reset);
  });

  it('should identify server errors correctly', () => {
    const error500 = new APIError('Server error', { statusCode: 500 });
    const error502 = new APIError('Bad gateway', { statusCode: 502 });
    const error400 = new APIError('Bad request', { statusCode: 400 });

    expect(error500.isServerError()).toBe(true);
    expect(error502.isServerError()).toBe(true);
    expect(error400.isServerError()).toBe(false);
  });

  it('should identify rate limit errors correctly', () => {
    const errorByCode = new APIError('Rate limit', { code: 'RATE_LIMIT_EXCEEDED' });
    const errorByStatus = new APIError('Rate limit', { statusCode: 429 });
    const errorOther = new APIError('Other error', { statusCode: 400 });

    expect(errorByCode.isRateLimit()).toBe(true);
    expect(errorByStatus.isRateLimit()).toBe(true);
    expect(errorOther.isRateLimit()).toBe(false);
  });

  it('should set correct recoverable flag based on status code', () => {
    const error400 = new APIError('Bad request', { statusCode: 400 });
    const error429 = new APIError('Rate limit', { statusCode: 429 });
    const error500 = new APIError('Server error', { statusCode: 500 });

    expect(error400.recoverable).toBe(true); // 4xx except 429 are recoverable
    expect(error429.recoverable).toBe(true); // 429 is recoverable
    expect(error500.recoverable).toBe(false); // 5xx is not recoverable
  });
});
