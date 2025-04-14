import type { ErrorOptions } from './types';

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
