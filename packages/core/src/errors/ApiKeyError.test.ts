import { describe, expect, it } from 'vitest';

import { ApiKeyError } from './ApiKeyError';

describe('ApiKeyError', () => {
  it('should create error with default values', () => {
    const error = new ApiKeyError('Invalid API key');
    expect(error.message).toBe('Invalid API key');
    expect(error.code).toBe('API_KEY_ERROR');
    expect(error.recoverable).toBe(false);
  });

  it('should create error with custom code', () => {
    const error = new ApiKeyError('Invalid API key', { code: 'INVALID_KEY' });
    expect(error.message).toBe('Invalid API key');
    expect(error.code).toBe('INVALID_KEY');
  });

  it('should create error with custom recoverable flag', () => {
    const error = new ApiKeyError('Invalid API key', { recoverable: true });
    expect(error.message).toBe('Invalid API key');
    expect(error.recoverable).toBe(true);
  });
});
