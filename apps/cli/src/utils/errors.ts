/**
 * Error handling utilities for CLI
 */

/**
 * Base error options
 */
export interface ErrorOptions {
  code?: string;
  cause?: Error;
  context?: Record<string, unknown>;
  recoverable?: boolean;
}

/**
 * Application error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly cause?: Error;
  public readonly context?: Record<string, unknown>;
  public readonly recoverable: boolean;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.cause = options.cause;
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Format the error for display
   */
  public format(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;
    
    if (Object.keys(this.context || {}).length > 0) {
      result += `\nContext: ${JSON.stringify(this.context, null, 2)}`;
    }
    
    if (this.cause) {
      result += `\nCaused by: ${this.cause instanceof AppError 
        ? this.cause.format() 
        : this.cause.message}`;
    }
    
    return result;
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
      recoverable: options.recoverable ?? true
    });
  }
}

/**
 * API error
 */
export class APIError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'API_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? false
    });
  }
}

/**
 * File system error
 */
export class FileSystemError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'FILE_SYSTEM_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true
    });
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      code: options.code ?? 'VALIDATION_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true
    });
  }
}

/**
 * Cost limit error
 */
export class CostLimitError extends AppError {
  constructor(
    message: string, 
    options: { 
      code?: string;
      cost: number;
      limit: number;
      cause?: Error | undefined; 
      context?: Record<string, unknown> 
    }
  ) {
    super(message, {
      ...options,
      code: options.code || 'ERR_COST_LIMIT',
      context: {
        cost: options.cost,
        limit: options.limit,
        ...options.context || {}
      }
    });
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
      recoverable: options.recoverable ?? true
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
      return Result.ok<U>(fn(this.value as T)) as unknown as Result<U, E>;
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
      throw new Error('Cannot map error from successful result');
    }
    return Result.fail<T, F>(fn(this.error));
  }

  /**
   * Get the value or a default
   */
  getValueOrDefault(defaultValue: T): T {
    if (this.error) {
      return defaultValue;
    }
    return this.value as T;
  }

  /**
   * Chain operations
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.error) {
      return Result.fail<U, E>(this.error);
    }
    return fn(this.value as T);
  }
}

/**
 * Try to execute a function and return a Result
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const value = await fn();
    return Result.ok<T>(value);
  } catch (error) {
    if (error instanceof AppError) {
      return Result.fail<T>(error);
    }
    return Result.fail<T>(
      new AppError(
        error instanceof Error ? error.message : String(error),
        { 
          cause: error instanceof Error ? error : undefined,
          code: 'ERR_UNKNOWN' 
        }
      )
    );
  }
} 