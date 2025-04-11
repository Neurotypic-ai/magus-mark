/**
 * Comprehensive error handling system for Obsidian Magic
 */

/**
 * Base error class for the plugin
 */
export class AppError extends Error {
  code: string;
  recoverable: boolean;

  constructor(message: string, code: string, recoverable = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.recoverable = recoverable;
  }
}

/**
 * Error thrown when there's an issue with API key or authentication
 */
export class ApiKeyError extends AppError {
  constructor(message: string, code = 'API_KEY_ERROR') {
    super(message, code, true);
  }
}

/**
 * Error thrown for OpenAI API issues
 */
export class ApiError extends AppError {
  statusCode: number | undefined;
  retryAfter: number | undefined;

  constructor(message: string, code = 'API_ERROR', statusCode?: number, retryAfter?: number) {
    const recoverable = statusCode ? statusCode < 500 || statusCode === 429 : false;
    super(message, code, recoverable);
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown for file system operations
 */
export class FileSystemError extends AppError {
  path: string | undefined;

  constructor(message: string, path?: string, code = 'FILE_SYSTEM_ERROR') {
    super(message, code, false);
    this.path = path;
  }
}

/**
 * Error thrown for tag processing issues
 */
export class TaggingError extends AppError {
  constructor(message: string, code = 'TAGGING_ERROR') {
    super(message, code, true);
  }
}

/**
 * Generic result type for operations that can fail
 */
export interface Result<T = undefined> {
  success: boolean;
  data?: T | undefined;
  error?:
    | {
        code: string;
        message: string;
        recoverable: boolean;
        [key: string]: unknown;
      }
    | undefined;
}

/**
 * Create a success result
 */
export function success<T>(data?: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure(error: AppError | Error): Result<never> {
  if (error instanceof AppError) {
    const errorObj: Record<string, unknown> = {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
    };

    // Add additional properties for specific error types
    if (error instanceof ApiError) {
      if (error.statusCode !== undefined) errorObj['statusCode'] = error.statusCode;
      if (error.retryAfter !== undefined) errorObj['retryAfter'] = error.retryAfter;
    }

    if (error instanceof FileSystemError && error.path !== undefined) {
      errorObj['path'] = error.path;
    }

    return {
      success: false,
      error: errorObj as Required<Result<never>>['error'],
    };
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: error.message || String(error),
      recoverable: false,
    },
  };
}

/**
 * Utility to handle API retries with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    retryableStatusCodes?: number[];
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
  let lastError: Error;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      // Check if we should retry
      const shouldRetry =
        attempt <= maxRetries &&
        error instanceof ApiError &&
        (retryableStatusCodes.includes(error.statusCode || 0) || error.recoverable);

      if (!shouldRetry) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);

      // Use retry-after header if available
      if (error instanceof ApiError && error.retryAfter) {
        delay = Math.min(error.retryAfter * 1000, maxDelay);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
