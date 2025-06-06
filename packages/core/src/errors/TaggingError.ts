import { AppError } from './AppError';

import type { ErrorOptions } from '../types/ErrorOptions';

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
      recoverable: options.recoverable ?? false,
    });
    this.documentId = options.documentId;
  }
}
