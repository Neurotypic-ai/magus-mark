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

    return function (...args: Parameters<T>): void {
      const now = Date.now();

      if (now - lastCall >= limit) {
        fn(...args);
        lastCall = now;
      } else {
        timeoutId ??= setTimeout(
          () => {
            fn(...args);
            lastCall = Date.now();
            timeoutId = null;
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
    const results: T[] = [];
    let nextTaskIndex = 0;
    const inProgress = new Set<Promise<void>>();

    async function runTask(taskIndex: number): Promise<void> {
      try {
        const task = tasks[taskIndex];
        if (task) {
          const result = await task();
          results[taskIndex] = result;
        }
      } catch (error) {
        // Store error in results array at the corresponding index
        results[taskIndex] = error as T;
      }
    }

    while (nextTaskIndex < tasks.length || inProgress.size > 0) {
      // Start new tasks if we haven't hit the concurrency limit
      while (inProgress.size < concurrency && nextTaskIndex < tasks.length) {
        const taskPromise = runTask(nextTaskIndex);
        inProgress.add(taskPromise);

        // Remove the task from in-progress when it completes
        void taskPromise.then(() => {
          inProgress.delete(taskPromise);
        });

        nextTaskIndex++;
      }

      // Wait for any task to complete if we've hit the limit
      if (inProgress.size >= concurrency) {
        await Promise.race(inProgress);
      }
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
