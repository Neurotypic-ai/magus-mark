import { APIError } from './APIError';
import { AppError } from './AppError';
import { FileSystemError } from './FileSystemError';

import type { ResultObject } from './types';

/**
 * Create a success result object
 */
export function success<T>(data?: T): ResultObject<T> {
  return { success: true, data };
}

/**
 * Create a failure result object
 */
export function failure(error: AppError | Error): ResultObject<never> {
  if (error instanceof AppError) {
    const errorObj: Record<string, unknown> = {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
    };

    // Add additional properties for specific error types
    if (error instanceof APIError) {
      if (error.statusCode !== undefined) errorObj['statusCode'] = error.statusCode;
      if (error.retryAfter !== undefined) errorObj['retryAfter'] = error.retryAfter;
    }

    if (error instanceof FileSystemError && error.path !== undefined) {
      errorObj['path'] = error.path;
    }

    return {
      success: false,
      error: errorObj as Required<ResultObject<never>>['error'],
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
