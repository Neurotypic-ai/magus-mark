/**
 * Base error options
 */
export interface ErrorOptions {
  code?: string | undefined;
  cause?: Error | undefined;
  context?: Record<string, unknown> | undefined;
  recoverable?: boolean | undefined;
}
