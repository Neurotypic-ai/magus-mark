import { describe, expect, it } from 'vitest';

import { AppError } from './AppError';

describe('AppError', () => {
  it('should create AppError with correct properties', () => {
    const error = new AppError('Test error', { code: 'TEST_CODE', recoverable: true });
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.recoverable).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should use default values when options are not provided', () => {
    const error = new AppError('Test error');
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.recoverable).toBe(false);
    expect(error.context).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });

  it('should format error with context and cause', () => {
    const cause = new Error('Original error');
    const error = new AppError('Wrapper error', {
      code: 'WRAPPER_ERROR',
      cause,
      context: { foo: 'bar' },
    });

    const formatted = error.format();
    expect(formatted).toContain('Wrapper error');
    expect(formatted).toContain('WRAPPER_ERROR');
    expect(formatted).toContain('Original error');
    expect(formatted).toContain('foo');
    expect(formatted).toContain('bar');
  });

  it('should handle nested AppError causes in format', () => {
    const innerCause = new Error('Inner error');
    const innerError = new AppError('Inner AppError', {
      code: 'INNER_ERROR',
      cause: innerCause,
    });

    const outerError = new AppError('Outer AppError', {
      code: 'OUTER_ERROR',
      cause: innerError,
    });

    const formatted = outerError.format();
    expect(formatted).toContain('Outer AppError');
    expect(formatted).toContain('OUTER_ERROR');
    expect(formatted).toContain('Inner AppError');
    expect(formatted).toContain('INNER_ERROR');
    expect(formatted).toContain('Inner error');
  });
});
