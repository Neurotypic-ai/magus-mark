import { APIError } from './APIError';
import { NetworkError } from './NetworkError';

/**
 * Utility to handle API retries with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number | undefined;
    initialDelay?: number | undefined;
    maxDelay?: number | undefined;
    factor?: number | undefined;
    retryableStatusCodes?: number[] | undefined;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    factor = 2,
    retryableStatusCodes = [429, 500, 502, 503, 504],
  } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      // Check if we should retry
      const shouldRetry =
        attempt <= maxRetries &&
        (error instanceof APIError
          ? retryableStatusCodes.includes(error.statusCode ?? 0) || error.recoverable
          : isRetryableError(error));

      if (!shouldRetry) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);

      // Use retry-after header if available
      if (error instanceof APIError && error.retryAfter) {
        delay = Math.min(error.retryAfter * 1000, maxDelay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never happen, but TypeScript needs it
  if (lastError) {
    throw lastError;
  }

  // This is unreachable, but needed for TypeScript
  throw new Error('Unexpected error in retry mechanism');
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.isRateLimit() || error.isServerError();
  }

  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    // Network-related error codes
    const networkErrorCodes = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'];

    return (
      networkErrorCodes.some((code) => typeof error === 'object' && 'code' in error && error.code === code) ||
      error.message.includes('ECONNREFUSED')
    );
  }

  return false;
}
