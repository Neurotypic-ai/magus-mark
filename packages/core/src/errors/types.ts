/**
 * Base error options
 */
export interface ErrorOptions {
  code?: string | undefined;
  cause?: Error | undefined;
  context?: Record<string, unknown> | undefined;
  recoverable?: boolean | undefined;
}

/**
 * Alternative Result interface for functions that don't throw
 */
export interface ResultObject<T = undefined> {
  success: boolean;
  data?: T | undefined;
  error?:
    | {
        code: string;
        message: string;
        recoverable: boolean;
        [key: string]: unknown;
      }
    | undefined;
}
