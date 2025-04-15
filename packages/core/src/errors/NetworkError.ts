import { AppError } from './AppError';

import type { ErrorOptions } from '../types/ErrorOptions';

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
