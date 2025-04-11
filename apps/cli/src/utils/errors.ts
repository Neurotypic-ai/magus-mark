/**
 * Error handling utilities for CLI
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public override readonly cause: Error | undefined;
  public readonly context: Record<string, unknown>;

  constructor(
    message: string, 
    options: { 
      code?: string; 
      cause?: Error | undefined; 
      context?: Record<string, unknown> 
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'ERR_UNKNOWN';
    this.cause = options.cause;
    this.context = options.context || {};

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Format the error for display
   */
  public format(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;
    
    if (Object.keys(this.context).length > 0) {
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
export class ConfigError extends AppError {
  constructor(
    message: string, 
    options: { 
      code?: string; 
      cause?: Error | undefined; 
      context?: Record<string, unknown> 
    } = {}
  ) {
    super(message, {
      ...options,
      code: options.code || 'ERR_CONFIG'
    });
  }
}

/**
 * API error
 */
export class ApiError extends AppError {
  constructor(
    message: string, 
    options: { 
      code?: string; 
      cause?: Error | undefined; 
      context?: Record<string, unknown> 
    } = {}
  ) {
    super(message, {
      ...options,
      code: options.code || 'ERR_API'
    });
  }
}

/**
 * File system error
 */
export class FileSystemError extends AppError {
  constructor(
    message: string, 
    options: { 
      code?: string; 
      cause?: Error | undefined; 
      context?: Record<string, unknown> 
    } = {}
  ) {
    super(message, {
      ...options,
      code: options.code || 'ERR_FILESYSTEM'
    });
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(
    message: string, 
    options: { 
      code?: string; 
      cause?: Error | undefined; 
      context?: Record<string, unknown> 
    } = {}
  ) {
    super(message, {
      ...options,
      code: options.code || 'ERR_VALIDATION'
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
 * Result type for operations that can fail
 */
export class Result<T, E extends Error = AppError> {
  private readonly _value: T | undefined;
  private readonly _error: E | undefined;
  
  private constructor(value?: T, error?: E) {
    this._value = value;
    this._error = error;
  }
  
  /**
   * Create a successful result
   */
  public static ok<T>(value: T): Result<T, AppError> {
    return new Result<T, AppError>(value, undefined);
  }
  
  /**
   * Create a failed result
   */
  public static fail<T, E extends Error>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error);
  }
  
  /**
   * Check if the result is successful
   */
  public isOk(): boolean {
    return this._error === undefined;
  }
  
  /**
   * Check if the result is failed
   */
  public isFail(): boolean {
    return this._error !== undefined;
  }
  
  /**
   * Get the value (throws if failed)
   */
  public getValue(): T {
    if (this._error !== undefined) {
      throw this._error;
    }
    return this._value as T;
  }
  
  /**
   * Get the error (throws if successful)
   */
  public getError(): E {
    if (this._error === undefined) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error;
  }
  
  /**
   * Map the value (if successful)
   */
  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._error !== undefined) {
      return Result.fail<U, E>(this._error);
    }
    return Result.ok<U>(fn(this._value as T)) as unknown as Result<U, E>;
  }
  
  /**
   * Map the error (if failed)
   */
  public mapError<F extends Error>(fn: (error: E) => F): Result<T, F> {
    if (this._error === undefined) {
      return Result.ok<T>(this._value as T) as unknown as Result<T, F>;
    }
    return Result.fail<T, F>(fn(this._error));
  }
  
  /**
   * Get the value or a default
   */
  public getValueOrDefault(defaultValue: T): T {
    if (this._error !== undefined) {
      return defaultValue;
    }
    return this._value as T;
  }
  
  /**
   * Chain operations
   */
  public andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._error !== undefined) {
      return Result.fail<U, E>(this._error);
    }
    return fn(this._value as T);
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
      return Result.fail<T, AppError>(error);
    }
    return Result.fail<T, AppError>(
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