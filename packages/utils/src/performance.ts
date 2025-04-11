/**
 * Performance utility functions for Obsidian Magic
 */

/**
 * Measures execution time of a function
 * @param fn - Function to measure
 * @param args - Arguments to pass to the function
 * @returns Result of the function and time taken in milliseconds
 */
export async function measureExecutionTime<T>(
  fn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<{ result: T; timeTaken: number }> {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();
  const timeTaken = end - start;

  return { result, timeTaken };
}

/**
 * Measures execution time of a synchronous function
 * @param fn - Function to measure
 * @param args - Arguments to pass to the function
 * @returns Result of the function and time taken in milliseconds
 */
export function measureExecutionTimeSync<T>(
  fn: (...args: any[]) => T,
  ...args: any[]
): { result: T; timeTaken: number } {
  const start = performance.now();
  const result = fn(...args);
  const end = performance.now();
  const timeTaken = end - start;

  return { result, timeTaken };
}

/**
 * Creates a debounced version of a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
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
export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>): void {
    const now = Date.now();

    if (now - lastCall >= limit) {
      fn(...args);
      lastCall = now;
    } else if (!timeoutId) {
      timeoutId = setTimeout(
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
export function memoize<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function (...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
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
export async function runWithConcurrencyLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
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
      results[taskIndex] = error as any;
    }
  }

  while (nextTaskIndex < tasks.length || inProgress.size > 0) {
    // Start new tasks if we haven't hit the concurrency limit
    while (inProgress.size < concurrency && nextTaskIndex < tasks.length) {
      const taskPromise = runTask(nextTaskIndex);
      inProgress.add(taskPromise);

      // Remove the task from in-progress when it completes
      taskPromise.then(() => {
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
export async function measureMemoryUsage<T>(
  fn: (...args: any[]) => Promise<T>,
  ...args: any[]
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
