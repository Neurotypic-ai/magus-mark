import { AppError } from './AppError';

import type { ErrorOptions } from './types';

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
