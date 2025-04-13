/**
 * Error handling system for Obsidian Magic
 * Implements custom error hierarchy, result pattern, and retry mechanisms
 */

// Base error class
export class AppError extends Error {
  constructor(
    message: string, 
    public readonly code: string, 
    public readonly recoverable = false
  ) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
  }
}

// API key related errors
export class ApiKeyError extends AppError {
  constructor(message: string) {
    super(message, 'API_KEY_ERROR', true);
  }
}

// Generic API errors
export class ApiError extends AppError {
  constructor(
    message: string,
    code = 'API_ERROR',
    public readonly statusCode?: number,
    public readonly retryAfter?: number
  ) {
    // API errors are considered recoverable if they are not 5xx errors
    const isRecoverable = statusCode !== undefined ? statusCode < 500 : false;
    super(message, code, isRecoverable);
  }
}

// File system errors
export class FileSystemError extends AppError {
  constructor(
    message: string,
    public readonly path?: string
  ) {
    super(message, 'FILE_SYSTEM_ERROR', false);
  }
}

// Tagging-specific errors
export class TaggingError extends AppError {
  constructor(message: string) {
    super(message, 'TAGGING_ERROR', true);
  }
}

// Result pattern for operations that can fail
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// Create a success result
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

// Create a failure result
export function failure(error: Error): Result<never> {
  if (error instanceof AppError) {
    return { success: false, error };
  }
  // Convert standard errors to AppError
  return {
    success: false,
    error: new AppError(error.message, 'UNKNOWN_ERROR', false)
  };
}

// Options for the retry mechanism
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
}

/**
 * Executes a function with retry capability for recoverable errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    factor = 2,
  } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // Ensure error is properly typed first
      let typedError: Error;
      if (err instanceof Error) {
        typedError = err;
      } else {
        typedError = new Error(String(err));
      }
      
      if (attempt === maxRetries) {
        throw typedError;
      }
      
      // Handle retryable errors
      if (isRetryableError(typedError)) {
        const delay = calculateBackoff(
          typedError as ApiError, 
          attempt, 
          initialDelay, 
          maxDelay, 
          factor
        );
        await sleep(delay);
      } else {
        throw typedError;
      }
    }
  }
  
  // This line is unreachable but satisfies the TypeScript compiler
  throw new Error('Maximum retry attempts exceeded');
}

// Helper to determine if an error should be retried
function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Retry on rate limits and server errors
    return error.statusCode === 429 || 
           (error.statusCode !== undefined && error.statusCode >= 500);
  }
  return false;
}

// Calculate exponential backoff with jitter
function calculateBackoff(
  error: ApiError,
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  factor: number
): number {
  // Use retryAfter from API if available
  if (error.retryAfter !== undefined && error.retryAfter > 0) {
    return error.retryAfter * 1000;
  }
  
  // Calculate exponential backoff
  const delay = Math.min(
    maxDelay,
    initialDelay * Math.pow(factor, attempt - 1)
  );
  
  // Add jitter (±10%)
  const jitter = delay * 0.1;
  return delay + (Math.random() * jitter * 2) - jitter;
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 
