import { AppError } from './AppError';

import type { ErrorOptions } from './types';

/**
 * Cost limit error
 */
export class CostLimitError extends AppError {
  constructor(
    message: string,
    options: ErrorOptions & {
      cost: number;
      limit: number;
    }
  ) {
    super(message, {
      ...options,
      code: options.code ?? 'COST_LIMIT_ERROR',
      context: {
        cost: options.cost,
        limit: options.limit,
        ...(options.context ?? {}),
      },
    });
  }
}
