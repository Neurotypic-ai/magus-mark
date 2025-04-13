import { describe, expect, it, vi } from 'vitest';

import {
  APIError,
  AppError,
  CostLimitError,
  FileSystemError,
  NetworkError,
  Result,
  ValidationError,
  failure,
  success,
  toAppError,
  tryCatch,
  tryOrNull,
  withRetry,
} from '../src/errors';

describe('Error Handling System', () => {
  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', { code: 'TEST_CODE', recoverable: true });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.recoverable).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create ValidationError with correct properties', () => {
      const validationErrors = { name: ['is required'] };
      const error = new ValidationError('Validation failed', {
        validationErrors,
        field: 'name',
      });
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.validationErrors).toBe(validationErrors);
      expect(error.field).toBe('name');
      expect(error.recoverable).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

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

    it('should create FileSystemError with correct properties', () => {
      const error = new FileSystemError('File not found', { path: '/path/to/file' });
      expect(error.message).toBe('File not found');
      expect(error.code).toBe('FILE_SYSTEM_ERROR');
      expect(error.path).toBe('/path/to/file');
      expect(error.recoverable).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should create CostLimitError with correct properties', () => {
      const error = new CostLimitError('Cost limit exceeded', {
        cost: 15,
        limit: 10,
      });
      expect(error.message).toBe('Cost limit exceeded');
      expect(error.code).toBe('COST_LIMIT_ERROR');
      expect(error.context).toEqual({ cost: 15, limit: 10 });
      expect(error instanceof AppError).toBe(true);
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
  });

  describe('Result Pattern', () => {
    it('should create a successful result', () => {
      const result = Result.ok('success');
      expect(result.isOk()).toBe(true);
      expect(result.isFail()).toBe(false);
      expect(result.getValue()).toBe('success');
      expect(() => result.getError()).toThrow();
    });

    it('should create a failed result', () => {
      const error = new Error('Failed');
      const result = Result.fail(error);
      expect(result.isOk()).toBe(false);
      expect(result.isFail()).toBe(true);
      expect(() => result.getValue()).toThrow(error);
      expect(result.getError()).toBe(error);
    });

    it('should map successful result', () => {
      const result = Result.ok(5);
      const mapped = result.map((x) => x * 2);
      expect(mapped.isOk()).toBe(true);
      expect(mapped.getValue()).toBe(10);
    });

    it('should chain operations with andThen', () => {
      const result = Result.ok(5)
        .andThen((x) => Result.ok(x * 2))
        .andThen((x) => Result.ok(x + 1));

      expect(result.isOk()).toBe(true);
      expect(result.getValue()).toBe(11);
    });

    it('should short-circuit on failure with andThen', () => {
      const error = new Error('Failed');
      const result = Result.ok(5)
        .andThen(() => Result.fail(error))
        .andThen((x) => Result.ok((x as number) + 1));

      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should support getValueOrDefault', () => {
      const success = Result.ok(5);
      const failure = Result.fail(new Error('Failed'));

      expect(success.getValueOrDefault(10)).toBe(5);
      expect(failure.getValueOrDefault(10)).toBe(10);
    });
  });

  describe('Result Object Pattern', () => {
    it('should create a success result object', () => {
      const result = success({ id: 1, name: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'test' });
      expect(result.error).toBeUndefined();
    });

    it('should create a failure result from AppError', () => {
      const error = new APIError('API error', { code: 'TEST_ERROR', statusCode: 500 });
      const result = failure(error);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('TEST_ERROR');
      expect(result.error?.message).toBe('API error');
      expect(result.error?.recoverable).toBe(false);
      expect(result.error?.['statusCode']).toBe(500);
    });

    it('should create a failure result from standard Error', () => {
      const error = new Error('Standard error');
      const result = failure(error);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
      expect(result.error?.message).toBe('Standard error');
      expect(result.error?.recoverable).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should convert unknown errors to AppError with toAppError', () => {
      const stringError = toAppError('String error');
      expect(stringError instanceof AppError).toBe(true);
      expect(stringError.message).toBe('String error');
      expect(stringError.code).toBe('UNKNOWN_ERROR');

      const originalError = new Error('Original error');
      const wrappedError = toAppError(originalError, 'CUSTOM_CODE');
      expect(wrappedError instanceof AppError).toBe(true);
      expect(wrappedError.message).toBe('Original error');
      expect(wrappedError.code).toBe('CUSTOM_CODE');
      expect(wrappedError.cause).toBe(originalError);

      const appError = new ValidationError('Already an AppError');
      const passedThrough = toAppError(appError);
      expect(passedThrough).toBe(appError);
    });

    it('should wrap async functions with tryCatch', async () => {
      const successFn = () => Promise.resolve('success');
      const failFn = () => Promise.reject(new Error('Failed'));

      const successResult = await tryCatch(successFn);
      expect(successResult.isOk()).toBe(true);
      expect(successResult.getValue()).toBe('success');

      const failResult = await tryCatch(failFn);
      expect(failResult.isFail()).toBe(true);
      expect(failResult.getError().message).toBe('Failed');
    });

    it('should wrap async functions with tryOrNull', async () => {
      const successFn = () => Promise.resolve('success');
      const failFn = () => Promise.reject(new Error('Failed'));

      const successResult = await tryOrNull(successFn);
      expect(successResult).toBe('success');

      const failResult = await tryOrNull(failFn);
      expect(failResult).toBeNull();
    });
  });

  describe('Retry Mechanism', () => {
    it('should return result on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on API errors that are retryable', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new APIError('Rate limit', { statusCode: 429 }))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after max attempts', async () => {
      const apiError = new APIError('Rate limit', { statusCode: 429 });
      const fn = vi.fn().mockRejectedValue(apiError);

      await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow(apiError);
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new ValidationError('Invalid input');
      const fn = vi.fn().mockRejectedValue(nonRetryableError);

      await expect(withRetry(fn)).rejects.toThrow(nonRetryableError);
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry on network errors', async () => {
      const networkError = new NetworkError('Connection failed');
      const fn = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValueOnce('success');

      const result = await withRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
