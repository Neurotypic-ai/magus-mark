import { AppError } from './AppError';
import { Result } from './Result';

/**
 * Try an async operation and convert to a Result
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const value = await fn();
    return Result.ok(value);
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Wrap an async operation that can fail with an error or a null value
 */
export async function tryOrNull<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Convert errors to AppError type
 */
export function toAppError(error: unknown, defaultCode = 'UNKNOWN_ERROR'): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, { code: defaultCode, cause: error });
  }

  return new AppError(String(error), { code: defaultCode });
}

/**
 * Normalize any error into an AppError
 */
export function normalizeError(error: unknown): AppError {
  return toAppError(error);
}
