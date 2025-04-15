import { AppError } from './AppError';

import type { ErrorOptions } from '../types/ErrorOptions';

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
