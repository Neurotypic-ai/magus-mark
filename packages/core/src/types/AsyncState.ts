/**
 * Async operation status
 */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async operation state
 */

export interface AsyncState<T, E = Error> {
  status: AsyncStatus;
  data?: T;
  error?: E;
}
