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
  public override readonly cause?: Error;
  public readonly context?: Record<string, unknown>;
  public readonly recoverable: boolean;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.cause = options.cause;
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;

    Error.captureStackTrace(this, this.constructor);
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
      recoverable: options.recoverable ?? true,
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
      recoverable: options.recoverable ?? true,
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
      recoverable: options.recoverable ?? true,
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
      recoverable: options.recoverable ?? false,
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
 * Operation result
 */
export class Result<T> {
  private readonly value: T | null;
  private readonly error: Error | null;

  private constructor(value: T | null, error: Error | null) {
    this.value = value;
    this.error = error;
  }

  /**
   * Create a successful result
   */
  static ok<U>(value: U): Result<U> {
    return new Result<U>(value, null);
  }

  /**
   * Create a failed result
   */
  static fail<U>(error: Error): Result<U> {
    return new Result<U>(null, error);
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
    if (this.error) {
      throw this.error;
    }
    return this.value as T;
  }

  /**
   * Get the error
   */
  getError(): Error {
    if (!this.error) {
      throw new Error('Cannot get error from successful result');
    }
    return this.error;
  }

  /**
   * Map the value
   */
  map<U>(fn: (value: T) => U): Result<U> {
    if (this.error) {
      return Result.fail<U>(this.error);
    }
    try {
      return Result.ok<U>(fn(this.value as T));
    } catch (error) {
      return Result.fail<U>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
