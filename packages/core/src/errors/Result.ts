/**
 * Operation result
 */
export class Result<T, E extends Error = Error> {
  private readonly value: T | null;
  private readonly error: E | null;

  private constructor(value: T | null, error: E | null) {
    this.value = value;
    this.error = error;
  }

  /**
   * Create a successful result
   */
  static ok<U>(value: U): Result<U> {
    return new Result<U, Error>(value, null);
  }

  /**
   * Create a failed result
   */
  static fail<U, F extends Error = Error>(error: F): Result<U, F> {
    return new Result<U, F>(null, error);
  }

  /**
   * Check if the result is successful
   */
  isOk(): boolean {
    return this.error === null;
  }

  /**
   * Check if the result is failed
   */
  isFail(): boolean {
    return this.error !== null;
  }

  /**
   * Get the value
   */
  getValue(): T {
    if (this.error !== null) {
      throw this.error;
    }
    return this.value as T;
  }

  /**
   * Get the error
   */
  getError(): E {
    if (this.error === null) {
      throw new Error('Cannot get error from successful result');
    }
    return this.error;
  }

  /**
   * Map the value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.error !== null) {
      return Result.fail<U, E>(this.error);
    }
    try {
      const result = fn(this.value as T);
      return new Result<U, E>(result, null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return Result.fail<U, E>(err as unknown as E);
    }
  }

  /**
   * Map the error
   */
  mapError<F extends Error>(fn: (error: E) => F): Result<T, F> {
    if (this.error === null) {
      return new Result<T, F>(this.value, null);
    }
    return Result.fail<T, F>(fn(this.error));
  }

  /**
   * Get the value or a default
   */
  getValueOrDefault(defaultValue: T): T {
    if (this.error !== null) {
      return defaultValue;
    }
    return this.value as T;
  }

  /**
   * Chain operations
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.error !== null) {
      return Result.fail<U, E>(this.error);
    }
    return fn(this.value as T);
  }
}
