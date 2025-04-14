import { describe, expect, it } from 'vitest';

import { NetworkError } from './NetworkError';

describe('NetworkError', () => {
  it('should create error with default values', () => {
    const error = new NetworkError('Network timeout');
    expect(error.message).toBe('Network timeout');
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.recoverable).toBe(true);
  });

  it('should create error with custom code', () => {
    const error = new NetworkError('Network timeout', { code: 'TIMEOUT' });
    expect(error.message).toBe('Network timeout');
    expect(error.code).toBe('TIMEOUT');
  });

  it('should create error with custom recoverable flag', () => {
    const error = new NetworkError('Network timeout', { recoverable: false });
    expect(error.message).toBe('Network timeout');
    expect(error.recoverable).toBe(false);
  });
});
