import { describe, expect, it } from 'vitest';

import { MarkdownError } from './MarkdownError';

describe('MarkdownError', () => {
  it('should create error with default values', () => {
    const error = new MarkdownError('Invalid markdown syntax');
    expect(error.message).toBe('Invalid markdown syntax');
    expect(error.code).toBe('MARKDOWN_ERROR');
    expect(error.recoverable).toBe(false);
  });

  it('should create error with custom code', () => {
    const error = new MarkdownError('Invalid markdown syntax', { code: 'INVALID_SYNTAX' });
    expect(error.message).toBe('Invalid markdown syntax');
    expect(error.code).toBe('INVALID_SYNTAX');
  });

  it('should create error with custom recoverable flag', () => {
    const error = new MarkdownError('Invalid markdown syntax', { recoverable: true });
    expect(error.message).toBe('Invalid markdown syntax');
    expect(error.recoverable).toBe(true);
  });
});
