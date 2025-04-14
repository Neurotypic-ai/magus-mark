import { describe, expect, it } from 'vitest';

import { TaggingError } from './TaggingError';

describe('TaggingError', () => {
  it('should create error with default values', () => {
    const error = new TaggingError('Failed to apply tags');
    expect(error.message).toBe('Failed to apply tags');
    expect(error.code).toBe('TAGGING_ERROR');
    expect(error.recoverable).toBe(false);
  });

  it('should create error with custom code', () => {
    const error = new TaggingError('Failed to apply tags', { code: 'TAG_VALIDATION_FAILED' });
    expect(error.message).toBe('Failed to apply tags');
    expect(error.code).toBe('TAG_VALIDATION_FAILED');
  });

  it('should create error with custom recoverable flag', () => {
    const error = new TaggingError('Failed to apply tags', { recoverable: true });
    expect(error.message).toBe('Failed to apply tags');
    expect(error.recoverable).toBe(true);
  });
});
