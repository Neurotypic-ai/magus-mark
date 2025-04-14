import { describe, expect, it } from 'vitest';

import { ConfigurationError } from './ConfigurationError';

describe('ConfigurationError', () => {
  it('should create error with default values', () => {
    const error = new ConfigurationError('Missing required config');
    expect(error.message).toBe('Missing required config');
    expect(error.code).toBe('CONFIGURATION_ERROR');
    expect(error.recoverable).toBe(false);
  });

  it('should create error with custom code', () => {
    const error = new ConfigurationError('Missing required config', { code: 'MISSING_CONFIG' });
    expect(error.message).toBe('Missing required config');
    expect(error.code).toBe('MISSING_CONFIG');
  });

  it('should create error with custom recoverable flag', () => {
    const error = new ConfigurationError('Missing required config', { recoverable: true });
    expect(error.message).toBe('Missing required config');
    expect(error.recoverable).toBe(true);
  });
});
