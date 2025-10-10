import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskQueue } from './TaskQueue';

import type { QueueConfig, TaskProcessor } from './TaskQueue';

vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

describe('TaskQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('enqueues task and emits event', async () => {
    const config: QueueConfig = {
      name: 'test-queue',
      concurrency: 2,
      retryDelay: 10,
      maxRetries: 2,
      processingTimeout: 5000,
    };

    const processor: TaskProcessor<string, string> = {
      process: async (task) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return task;
      },
    };

    const queue = new TaskQueue(config, processor);
    const enqueuedSpy = vi.fn();
    queue.on('task:enqueued', enqueuedSpy);

    queue.pause();
    queue.enqueue('task1', 'payload1', 5);

    expect(enqueuedSpy).toHaveBeenCalled();
    const task = queue.getTask('task1');
    expect(task?.priority).toBe(5);

    queue.stop();
  });

  it('getStats returns queue state', () => {
    const config: QueueConfig = {
      name: 'test-queue',
      concurrency: 1,
      retryDelay: 10,
      maxRetries: 0,
      processingTimeout: 5000,
    };

    const processor: TaskProcessor<string, string> = {
      process: async (task) => task,
    };

    const queue = new TaskQueue(config, processor);
    queue.enqueue('task1', 'p1');
    queue.enqueue('task2', 'p2');

    const stats = queue.getStats();
    expect(stats.queueLength).toBe(2);
  });

  it('pause and stop control queue state', () => {
    const config: QueueConfig = {
      name: 'control-queue',
      concurrency: 1,
      retryDelay: 10,
      maxRetries: 0,
      processingTimeout: 5000,
    };

    const processor: TaskProcessor<string, string> = {
      process: async (task) => task,
    };

    const queue = new TaskQueue(config, processor);
    const pausedSpy = vi.fn();
    const stoppedSpy = vi.fn();

    queue.on('queue:paused', pausedSpy);
    queue.on('queue:stopped', stoppedSpy);

    queue.pause();
    expect(pausedSpy).toHaveBeenCalled();

    queue.stop();
    expect(stoppedSpy).toHaveBeenCalled();
  });
});
