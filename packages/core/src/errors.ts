/**
 * Custom error classes for standardized error handling across the application
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  code: string;
  recoverable: boolean;

  constructor(message: string, code: string, recoverable = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.recoverable = recoverable;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * API-related errors
 */
export class APIError extends AppError {
  status?: number | undefined;
  rateLimitInfo?:
    | {
        retryAfter?: number | undefined;
        limit?: number | undefined;
        remaining?: number | undefined;
        reset?: Date | undefined;
      }
    | undefined;

  constructor(
    message: string,
    code = 'API_ERROR',
    recoverable = true,
    status?: number,
    rateLimitInfo?: {
      retryAfter?: number | undefined;
      limit?: number | undefined;
      remaining?: number | undefined;
      reset?: Date | undefined;
    }
  ) {
    super(message, code, recoverable);
    this.status = status;
    this.rateLimitInfo = rateLimitInfo;
  }

  /**
   * Helper to check if this is a rate limit error
   */
  isRateLimit(): boolean {
    return this.status === 429 || this.code === 'RATE_LIMIT_EXCEEDED';
  }

  /**
   * Helper to check if this is a server error
   */
  isServerError(): boolean {
    return this.status !== undefined && this.status >= 500 && this.status < 600;
  }
}

/**
 * Tagging-related errors
 */
export class TaggingError extends AppError {
  documentId?: string | undefined;

  constructor(message: string, code = 'TAGGING_ERROR', recoverable = false, documentId?: string) {
    super(message, code, recoverable);
    this.documentId = documentId;
  }
}

/**
 * Markdown processing errors
 */
export class MarkdownError extends AppError {
  filePath?: string | undefined;

  constructor(message: string, code = 'MARKDOWN_ERROR', recoverable = true, filePath?: string) {
    super(message, code, recoverable);
    this.filePath = filePath;
  }
}

/**
 * Configuration errors
 */
export class ConfigError extends AppError {
  constructor(message: string, code = 'CONFIG_ERROR', recoverable = false) {
    super(message, code, recoverable);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  validationErrors: Record<string, string[]>;

  constructor(
    message: string,
    validationErrors: Record<string, string[]>,
    code = 'VALIDATION_ERROR',
    recoverable = true
  ) {
    super(message, code, recoverable);
    this.validationErrors = validationErrors;
  }
}

/**
 * Convert unknown errors to AppError
 *
 * @param error Any error object
 * @returns A properly typed AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', false);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppError(error, 'STRING_ERROR', false);
  }

  // Handle other types
  return new AppError(`Unknown error: ${JSON.stringify(error)}`, 'UNKNOWN_ERROR', false);
}

/**
 * Error codes for the application
 */
export const ErrorCodes = {
  // API errors
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

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
  CONFIG_ERROR: 'CONFIG_ERROR',
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_MODEL: 'INVALID_MODEL',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
