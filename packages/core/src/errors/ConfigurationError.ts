import { AppError } from './AppError';

import type { ErrorOptions } from './ErrorOptions';

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
