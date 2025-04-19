import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Chrono } from './Chrono';

describe.only('Chrono', () => {
  describe('Singleton Instance', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = Chrono.getInstance();
      const instance2 = Chrono.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(Chrono.getInstance());
    });
  });

  describe('Class Methods', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
    });

    it('should measure execution time of async function using class method', async () => {
      const asyncFn = async (delay: number): Promise<string> => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return 'result';
      };

      const { result, timeTaken } = await chrono.measureExecutionTime(asyncFn, 50);

      expect(result).toBe('result');
      expect(timeTaken).toBeGreaterThanOrEqual(40); // Allow for slight variance
      expect(timeTaken).toBeLessThan(200); // Prevent test from hanging
    });

    it('should measure execution time of sync function using class method', () => {
      const syncFn = (iterations: number): number => {
        let result = 0;
        for (let i = 0; i < iterations; i++) {
          result += i;
        }
        return result;
      };

      const { result, timeTaken } = chrono.measureExecutionTimeSync(syncFn, 1000000);

      expect(result).toBe(499999500000); // Sum of numbers 0 to 999999
      expect(timeTaken).toBeGreaterThan(0);
    });
  });

  describe('measureExecutionTime', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
    });

    it('should measure execution time of async function', async () => {
      const asyncFn = async (delay: number): Promise<string> => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return 'result';
      };

      const { result, timeTaken } = await chrono.measureExecutionTime(asyncFn, 50);

      expect(result).toBe('result');
      expect(timeTaken).toBeGreaterThanOrEqual(40); // Allow for slight variance
      expect(timeTaken).toBeLessThan(200); // Prevent test from hanging
    });

    it('should handle async functions with multiple arguments', async () => {
      const asyncFn = async (a: number, b: string): Promise<string> => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return `${String(a)}-${b}`;
      };

      const { result, timeTaken } = await chrono.measureExecutionTime(asyncFn, 42, 'test');

      expect(result).toBe('42-test');
      expect(timeTaken).toBeGreaterThan(0);
    });
  });

  describe('measureExecutionTimeSync', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
    });

    it('should measure execution time of sync function', () => {
      const syncFn = (iterations: number): number => {
        let result = 0;
        for (let i = 0; i < iterations; i++) {
          result += i;
        }
        return result;
      };

      const { result, timeTaken } = chrono.measureExecutionTimeSync(syncFn, 1000000);

      expect(result).toBe(499999500000); // Sum of numbers 0 to 999999
      expect(timeTaken).toBeGreaterThan(0);
    });

    it('should handle sync functions with multiple arguments', () => {
      const syncFn = (a: number, b: string): string => {
        return `${String(a)}-${b}`;
      };

      const { result, timeTaken } = chrono.measureExecutionTimeSync(syncFn, 42, 'test');

      expect(result).toBe('42-test');
      expect(timeTaken).toBeGreaterThanOrEqual(0);
    });
  });

  describe('debounce', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
      vi.useFakeTimers();
    });

    it('should delay function execution', () => {
      const callback = vi.fn();
      const debounced = chrono.debounce(callback, 100);

      debounced();
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should reset timer when called again before timeout', () => {
      const callback = vi.fn();
      const debounced = chrono.debounce(callback, 100);

      debounced();
      vi.advanceTimersByTime(50);

      debounced(); // Reset timer
      vi.advanceTimersByTime(50);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
      const callback = vi.fn();
      const debounced = chrono.debounce(callback, 100);

      debounced(1, 'test', { key: 'value' });
      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith(1, 'test', { key: 'value' });
    });
  });

  describe('throttle', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
      vi.useFakeTimers();
    });

    it('should limit function calls', () => {
      const callback = vi.fn();
      const throttled = chrono.throttle(callback, 100);

      throttled();
      expect(callback).toHaveBeenCalledTimes(1);

      throttled(); // This call should be ignored
      throttled(); // This call should be ignored
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should queue last call during throttle period', () => {
      const callback = vi.fn();
      const throttled = chrono.throttle(callback, 100);

      throttled('first');
      expect(callback).toHaveBeenCalledWith('first');

      throttled('ignored');
      throttled('queued');
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledWith('queued');
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to the throttled function', () => {
      const callback = vi.fn();
      const throttled = chrono.throttle(callback, 100);

      throttled(1, 'test', { key: 'value' });
      expect(callback).toHaveBeenCalledWith(1, 'test', { key: 'value' });
    });
  });

  describe('memoize', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
    });

    it('should cache function results', () => {
      const fn = vi.fn().mockImplementation((a: number, b: number) => a + b);
      const memoizedFn = chrono.memoize(fn as (...args: unknown[]) => unknown);

      // First call - should execute the function
      expect(memoizedFn(1, 2)).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);

      // Second call with same args - should use cached result
      expect(memoizedFn(1, 2)).toBe(3);
      expect(fn).toHaveBeenCalledTimes(1);

      // Call with different args - should execute the function again
      expect(memoizedFn(2, 3)).toBe(5);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle complex arguments', () => {
      const fn = vi.fn().mockImplementation((obj: { a: number; b: string[] }) => String(obj.a) + obj.b.join(''));
      const memoizedFn = chrono.memoize(fn as (...args: unknown[]) => unknown);

      // First call
      expect(memoizedFn({ a: 1, b: ['x', 'y'] })).toBe('1xy');
      expect(fn).toHaveBeenCalledTimes(1);

      // Same structure but different object reference - should use cache
      expect(memoizedFn({ a: 1, b: ['x', 'y'] })).toBe('1xy');
      expect(fn).toHaveBeenCalledTimes(1);

      // Different values - should call function again
      expect(memoizedFn({ a: 2, b: ['z'] })).toBe('2z');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('runWithConcurrencyLimit', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
    });

    it('should execute tasks with concurrency limit', async () => {
      const results: number[] = [];
      const tasks = [
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          results.push(1);
          return 1;
        },
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          results.push(2);
          return 2;
        },
        async () => {
          await new Promise((r) => setTimeout(r, 30));
          results.push(3);
          return 3;
        },
        async () => {
          await new Promise((r) => setTimeout(r, 20));
          results.push(4);
          return 4;
        },
      ];

      // Use real timers instead of fake timers
      vi.useRealTimers();
      const startTime = Date.now();
      const taskResults = await chrono.runWithConcurrencyLimit(tasks, 2);
      const endTime = Date.now();

      // Expected execution order based on completion time with concurrency 2:
      // t=10ms: task 2 finishes
      // t=40ms: task 3 finishes
      // t=50ms: task 1 finishes
      // t=60ms: task 4 finishes
      expect(results).toEqual([2, 3, 1, 4]);
      // Task results should be in original order
      expect(taskResults).toEqual([1, 2, 3, 4]);

      // Check total time (should be roughly max(50, 10+30, 10+20, 40+20) due to concurrency 2)
      // Longest path is task 2(10) -> task 3(30) -> task 4(20) = 60ms
      expect(endTime - startTime).toBeLessThan(150); // Allow generous buffer
      expect(endTime - startTime).toBeGreaterThanOrEqual(60); // Should take at least 60ms
    });

    it('should handle errors in tasks', async () => {
      const tasks = [
        async () => {
          await Promise.resolve();
          return 1;
        },
        async () => {
          await Promise.resolve();
          throw new Error('Task failed');
        },
        async () => {
          await Promise.resolve();
          return 3;
        },
      ];

      const results = await chrono.runWithConcurrencyLimit(tasks, 2);

      expect(results[0]).toBe(1);
      expect(results[1]).toBeInstanceOf(Error);
      const error = results[1] as unknown as Error;
      expect(error.message).toBe('Task failed');
      expect(results[2]).toBe(3);
    });
  });

  describe('measureMemoryUsage', () => {
    let chrono: Chrono;

    beforeEach(() => {
      chrono = Chrono.getInstance();
      vi.useRealTimers();
    });

    // Not using fake timers here as they can interfere with memory usage measurement
    it('should measure memory usage of a function', async () => {
      // Mock process.memoryUsage
      const originalMemoryUsage = process.memoryUsage;
      const mockMemoryUsageValue = {
        rss: 1000,
        heapTotal: 500,
        heapUsed: 300,
        external: 100,
        arrayBuffers: 50,
      };
      const mockMemoryUsageValue2 = {
        rss: 1200,
        heapTotal: 600,
        heapUsed: 350,
        external: 120,
        arrayBuffers: 60,
      };

      const mockMemoryUsage = vi
        .fn()
        .mockReturnValueOnce(mockMemoryUsageValue)
        .mockReturnValueOnce(mockMemoryUsageValue2);

      // Type-safe mock assignment
      process.memoryUsage = mockMemoryUsage as unknown as typeof process.memoryUsage;

      const fn = async (size: number): Promise<number[]> => {
        const arr = new Array(size).fill(0).map((_, i) => i);
        await new Promise((r) => setTimeout(r, 5));
        return arr;
      };

      const { result, memoryStats } = await chrono.measureMemoryUsage(fn, 1000);

      // Restore original process.memoryUsage
      process.memoryUsage = originalMemoryUsage;

      expect(result.length).toBe(1000);
      expect(memoryStats.before).toEqual({ rss: 1000, heapTotal: 500, heapUsed: 300, external: 100, arrayBuffers: 50 });
      expect(memoryStats.after).toEqual({ rss: 1200, heapTotal: 600, heapUsed: 350, external: 120, arrayBuffers: 60 });
      expect(memoryStats.diff).toEqual({ rss: 200, heapTotal: 100, heapUsed: 50, external: 20, arrayBuffers: 10 });
    });
  });
});
