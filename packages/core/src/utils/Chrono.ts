/**
 * Performance utility functions for Obsidian Magic
 */

/**
 * Class providing performance measurement and optimization utilities
 */
export class Chrono {
  // Singleton instance
  private static instance: Chrono | undefined;

  private constructor() {
    // Private constructor to prevent instantiation
  }
  /**
   * Returns the singleton instance of Chrono
   */
  public static getInstance(): Chrono {
    Chrono.instance ??= new Chrono();
    return Chrono.instance;
  }

  /**
   * Measures execution time of a function
   * @param fn - Function to measure
   * @param args - Arguments to pass to the function
   * @returns Result of the function and time taken in milliseconds
   */
  async measureExecutionTime<T, Args extends unknown[]>(
    fn: (...args: Args) => Promise<T>,
    ...args: Args
  ): Promise<{ result: T; timeTaken: number }> {
    const start = globalThis.performance.now();
    const result = await fn(...args);
    const end = globalThis.performance.now();
    const timeTaken = end - start;

    return { result, timeTaken };
  }

  /**
   * Measures execution time of a synchronous function
   * @param fn - Function to measure
   * @param args - Arguments to pass to the function
   * @returns Result of the function and time taken in milliseconds
   */
  measureExecutionTimeSync<T, Args extends unknown[]>(
    fn: (...args: Args) => T,
    ...args: Args
  ): { result: T; timeTaken: number } {
    const start = globalThis.performance.now();
    const result = fn(...args);
    const end = globalThis.performance.now();
    const timeTaken = end - start;

    return { result, timeTaken };
  }

  /**
   * Creates a debounced version of a function
   * @param fn - Function to debounce
   * @param delay - Delay in milliseconds
   * @returns Debounced function
   */
  debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return function (...args: Parameters<T>): void {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Creates a throttled version of a function
   * @param fn - Function to throttle
   * @param limit - Time limit in milliseconds
   * @returns Throttled function
   */
  throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    let pendingArgs: Parameters<T> | null = null;

    return function (...args: Parameters<T>): void {
      const now = Date.now();

      if (now - lastCall >= limit) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        fn(...args);
        lastCall = now;
      } else {
        pendingArgs = args;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(
          () => {
            fn(...pendingArgs!);
            lastCall = Date.now();
            timeoutId = null;
            pendingArgs = null;
          },
          limit - (now - lastCall)
        );
      }
    };
  }

  /**
   * Creates a memoized version of a function
   * @param fn - Function to memoize
   * @returns Memoized function
   */
  memoize<T extends (...args: unknown[]) => unknown>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
    const cache = new Map<string, ReturnType<T>>();

    return function (...args: Parameters<T>): ReturnType<T> {
      const key = JSON.stringify(args);

      const cachedResult = cache.get(key);
      if (cachedResult !== undefined) {
        return cachedResult;
      }

      const result = fn(...args) as ReturnType<T>;
      cache.set(key, result);
      return result;
    };
  }

  /**
   * Runs tasks with a concurrency limit
   * @param tasks - Array of async tasks
   * @param concurrency - Maximum number of concurrent tasks
   * @returns Promise that resolves when all tasks complete
   */
  async runWithConcurrencyLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    interface IndexedResult { index: number; result: T }
    const inFlight = new Map<Promise<IndexedResult>, number>();
    const keys = () => Array.from(inFlight.keys());
    for (let i = 0; i < tasks.length; i++) {
      const p = tasks[i]!().then(
        (res) => ({ index: i, result: res }) as IndexedResult,
        (err) => ({ index: i, result: err as T }) as IndexedResult
      );
      inFlight.set(p, i);
      if (inFlight.size >= concurrency) {
        const fin = await Promise.race(keys());
        results[fin.index] = fin.result;
        // remove the settled promise
        for (const [promise, idx] of inFlight) {
          if (idx === fin.index) {
            inFlight.delete(promise);
            break;
          }
        }
      }
    }
    // Await any remaining promises
    for (const [promise] of inFlight) {
      const fin = await promise;
      results[fin.index] = fin.result;
    }
    return results;
  }

  /**
   * Measures memory usage of a function
   * @param fn - Function to measure
   * @param args - Arguments to pass to the function
   * @returns Result of the function and memory statistics
   */
  async measureMemoryUsage<T, Args extends unknown[]>(
    fn: (...args: Args) => Promise<T>,
    ...args: Args
  ): Promise<{
    result: T;
    memoryStats: { before: NodeJS.MemoryUsage; after: NodeJS.MemoryUsage; diff: Record<string, number> };
  }> {
    // Note: For more accurate measurements, run Node.js with --expose-gc flag and call gc() here
    const before = process.memoryUsage();
    const result = await fn(...args);
    const after = process.memoryUsage();

    // Calculate difference
    const diff: Record<string, number> = {};
    for (const key in before) {
      if (Object.prototype.hasOwnProperty.call(before, key)) {
        const typedKey = key as keyof NodeJS.MemoryUsage;
        diff[key] = after[typedKey] - before[typedKey];
      }
    }

    return {
      result,
      memoryStats: { before, after, diff },
    };
  }
}
