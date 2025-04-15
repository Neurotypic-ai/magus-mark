import { AppError } from './AppError';

import type { ErrorOptions } from '../types/ErrorOptions';

/**
 * Markdown processing error
 */
export class MarkdownError extends AppError {
  public readonly filePath?: string | undefined;

  constructor(message: string, options: ErrorOptions & { filePath?: string | undefined } = {}) {
    super(message, {
      code: options.code ?? 'MARKDOWN_ERROR',
      cause: options.cause,
      context: options.context,
      recoverable: options.recoverable ?? true,
    });
    this.filePath = options.filePath;
  }
}
