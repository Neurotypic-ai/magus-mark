import { AppError } from './AppError';

import type { ErrorOptions } from './types';

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
