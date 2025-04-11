import { describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  ApiKeyError,
  AppError,
  FileSystemError,
  TaggingError,
  failure,
  success,
  withRetry,
} from '../../src/services/errors';

describe('Error Handling System', () => {
  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', true);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.recoverable).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create ApiKeyError with correct properties', () => {
      const error = new ApiKeyError('Missing API key');
      expect(error.message).toBe('Missing API key');
      expect(error.code).toBe('API_KEY_ERROR');
      expect(error.recoverable).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should create ApiError with correct properties', () => {
      const error = new ApiError('Rate limit exceeded', 'RATE_LIMIT', 429, 30);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(30);
      expect(error.recoverable).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should create FileSystemError with correct properties', () => {
      const error = new FileSystemError('File not found', '/path/to/file');
      expect(error.message).toBe('File not found');
      expect(error.code).toBe('FILE_SYSTEM_ERROR');
      expect(error.path).toBe('/path/to/file');
      expect(error.recoverable).toBe(false);
      expect(error instanceof AppError).toBe(true);
    });

    it('should create TaggingError with correct properties', () => {
      const error = new TaggingError('Failed to tag document');
      expect(error.message).toBe('Failed to tag document');
      expect(error.code).toBe('TAGGING_ERROR');
      expect(error.recoverable).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('Result Pattern', () => {
    it('should create a success result', () => {
      const result = success({ id: 1, name: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'test' });
      expect(result.error).toBeUndefined();
    });

    it('should create a failure result from AppError', () => {
      const error = new ApiError('API error', 'TEST_ERROR', 500);
      const result = failure(error);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('TEST_ERROR');
      expect(result.error?.message).toBe('API error');
      expect(result.error?.recoverable).toBe(false);
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
        .mockRejectedValueOnce(new ApiError('Rate limit', 'RATE_LIMIT', 429))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should stop retrying after max attempts', async () => {
      const apiError = new ApiError('Rate limit', 'RATE_LIMIT', 429);
      const fn = vi.fn().mockRejectedValue(apiError);

      await expect(withRetry(fn, { maxRetries: 2 })).rejects.toThrow(apiError);
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new FileSystemError('File not found');
      const fn = vi.fn().mockRejectedValue(nonRetryableError);

      await expect(withRetry(fn)).rejects.toThrow(nonRetryableError);
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });
  });
});
