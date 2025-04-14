/**
 * Unified error handling system for Obsidian Magic
 */

/**
 * Base error options
 */
export interface ErrorOptions {
  code?: string | undefined;
  cause?: Error | undefined;
  context?: Record<string, unknown> | undefined;
  recoverable?: boolean | undefined;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public override readonly cause?: Error | undefined;
  public readonly context?: Record<string, unknown> | undefined;
  public readonly recoverable: boolean;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.cause = options.cause;
    this.context = options.context;
    this.recoverable = options.recoverable ?? false;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Format the error for display
   */
  public format(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;

    // Add context if available
    const contextJSON = this.context ? JSON.stringify(this.context, null, 2) : '';
    if (contextJSON !== '{}' && contextJSON !== '') {
      result += `\nContext: ${contextJSON}`;
    }

    if (this.cause) {
      result += `\nCaused by: ${this.cause instanceof AppError ? this.cause.format() : this.cause.message}`;
    }

    return result;
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  public readonly validationErrors?: Record<string, string[]> | undefined;
  public readonly field?: string | undefined;

  constructor(
    message: string,
    options: ErrorOptions & {
      validationErrors?: Record<string, string[]> | undefined;
      field?: string | undefined;
    } = {}
  ) {
    super(message, {
      code: options.code ?? 'VALIDATION_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
    this.validationErrors = options.validationErrors;
    this.field = options.field;
  }
}

/**
 * File system error
 */
export class FileSystemError extends AppError {
  public readonly path?: string | undefined;

  constructor(message: string, options: ErrorOptions & { path?: string | undefined } = {}) {
    super(message, {
      code: options.code ?? 'FILE_SYSTEM_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
    this.path = options.path;
  }
}

/**
 * Network error
 */
export class NetworkError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'NETWORK_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
  }
}

/**
 * API error
 */
export class APIError extends AppError {
  public readonly statusCode?: number | undefined;
  public readonly retryAfter?: number | undefined;
  public readonly rateLimitInfo?:
    | {
        limit?: number | undefined;
        remaining?: number | undefined;
        reset?: Date | undefined;
      }
    | undefined;

  constructor(
    message: string,
    options: ErrorOptions & {
      statusCode?: number | undefined;
      retryAfter?: number | undefined;
      rateLimitInfo?:
        | {
            limit?: number | undefined;
            remaining?: number | undefined;
            reset?: Date | undefined;
          }
        | undefined;
    } = {}
  ) {
    // API errors are recoverable if they're rate limit (429) or non-5xx
    const isRecoverable = options.statusCode
      ? options.statusCode === 429 || options.statusCode < 500
      : (options.recoverable ?? false);

    super(message, {
      code: options.code ?? 'API_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: isRecoverable,
    });

    this.statusCode = options.statusCode;
    this.retryAfter = options.retryAfter;
    this.rateLimitInfo = options.rateLimitInfo;
  }

  /**
   * Helper to check if this is a rate limit error
   */
  isRateLimit(): boolean {
    return this.statusCode === 429 || this.code === 'RATE_LIMIT_EXCEEDED';
  }

  /**
   * Helper to check if this is a server error
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500 && this.statusCode < 600;
  }
}

/**
 * API key error
 */
export class ApiKeyError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'API_KEY_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'CONFIGURATION_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
  }
}

/**
 * Markdown processing error
 */
export class MarkdownError extends AppError {
  public readonly filePath?: string | undefined;

  constructor(message: string, options: ErrorOptions & { filePath?: string | undefined } = {}) {
    super(message, {
      code: options.code ?? 'MARKDOWN_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
    this.filePath = options.filePath;
  }
}

/**
 * Tagging-related errors
 */
export class TaggingError extends AppError {
  public readonly documentId?: string | undefined;

  constructor(message: string, options: ErrorOptions & { documentId?: string | undefined } = {}) {
    super(message, {
      code: options.code ?? 'TAGGING_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
    this.documentId = options.documentId;
  }
}

/**
 * Cost limit error
 */
export class CostLimitError extends AppError {
  constructor(
    message: string,
    options: ErrorOptions & {
      cost: number;
      limit: number;
    }
  ) {
    super(message, {
      ...options,
      code: options.code ?? 'COST_LIMIT_ERROR',
      context: {
        cost: options.cost,
        limit: options.limit,
        ...(options.context ?? {}),
      },
    });
  }
}

/**
 * Operation result
 */
export class Result<T, E extends Error = Error> {
  private readonly value: T | null;
  private readonly error: E | null;

  private constructor(value: T | null, error: E | null) {
    this.value = value;
    this.error = error;
  }

  /**
   * Create a successful result
   */
  static ok<U>(value: U): Result<U> {
    return new Result<U, Error>(value, null);
  }

  /**
   * Create a failed result
   */
  static fail<U, F extends Error = Error>(error: F): Result<U, F> {
    return new Result<U, F>(null, error);
  }

  /**
   * Check if the result is successful
   */
  isOk(): boolean {
    return this.error === null;
  }

  /**
   * Check if the result is failed
   */
  isFail(): boolean {
    return this.error !== null;
  }

  /**
   * Get the value
   */
  getValue(): T {
    if (this.error !== null) {
      throw this.error;
    }
    return this.value as T;
  }

  /**
   * Get the error
   */
  getError(): E {
    if (this.error === null) {
      throw new Error('Cannot get error from successful result');
    }
    return this.error;
  }

  /**
   * Map the value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.error !== null) {
      return Result.fail<U, E>(this.error);
    }
    try {
      const result = fn(this.value as T);
      return new Result<U, E>(result, null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return Result.fail<U, E>(err as unknown as E);
    }
  }

  /**
   * Map the error
   */
  mapError<F extends Error>(fn: (error: E) => F): Result<T, F> {
    if (this.error === null) {
      return new Result<T, F>(this.value, null);
    }
    return Result.fail<T, F>(fn(this.error));
  }

  /**
   * Get the value or a default
   */
  getValueOrDefault(defaultValue: T): T {
    if (this.error !== null) {
      return defaultValue;
    }
    return this.value as T;
  }

  /**
   * Chain operations
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.error !== null) {
      return Result.fail<U, E>(this.error);
    }
    return fn(this.value as T);
  }
}

/**
 * Alternative Result interface for functions that don't throw
 */
export interface ResultObject<T = undefined> {
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
function isRetryableError(error: unknown): boolean {
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

/**
 * Error codes for the application
 */
export const ErrorCodes = {
  // API errors
  API_ERROR: 'API_ERROR',
  API_KEY_ERROR: 'API_KEY_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // File system errors
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Tagging errors
  TAGGING_ERROR: 'TAGGING_ERROR',
  EMPTY_CONTENT: 'EMPTY_CONTENT',
  INVALID_TAXONOMY: 'INVALID_TAXONOMY',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',

  // Markdown errors
  MARKDOWN_ERROR: 'MARKDOWN_ERROR',
  FRONTMATTER_PARSE_ERROR: 'FRONTMATTER_PARSE_ERROR',
  FRONTMATTER_UPDATE_ERROR: 'FRONTMATTER_UPDATE_ERROR',

  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_MODEL: 'INVALID_MODEL',
  COST_LIMIT_ERROR: 'COST_LIMIT_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
