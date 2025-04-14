/**
 * Type-safe event emitter types
 */

export interface TypedEventEmitter<TEvents extends Record<string, unknown[]>> {
  on<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
  off<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
  once<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void;
}
