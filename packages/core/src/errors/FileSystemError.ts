import { AppError } from './AppError';

import type { ErrorOptions } from '../types/ErrorOptions';

/**
 * File system error
 */
export class FileSystemError extends AppError {
  public readonly path?: string | undefined;

  constructor(message: string, options: ErrorOptions & { path?: string | undefined } = {}) {
    super(message, {
      code: options.code ?? 'FILE_SYSTEM_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
    this.path = options.path;
  }
}
