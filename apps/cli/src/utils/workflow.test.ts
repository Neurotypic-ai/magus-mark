import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Workflow } from './workflow';

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

describe('Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('processes tasks respecting concurrency limit', async () => {
    const workflow = new Workflow<number>({ concurrency: 2 });

    let activeCount = 0;
    let maxConcurrent = 0;

    const createTask = (id: string, delay: number) => async () => {
      activeCount++;
      maxConcurrent = Math.max(maxConcurrent, activeCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      activeCount--;
      return parseInt(id.split('-')[1] ?? '0', 10);
    };

    workflow.addTask('task-1', createTask('task-1', 50));
    workflow.addTask('task-2', createTask('task-2', 50));
    workflow.addTask('task-3', createTask('task-3', 50));
    workflow.addTask('task-4', createTask('task-4', 50));

    await workflow.start();

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it('respects task priority ordering', async () => {
    const workflow = new Workflow<string>({ concurrency: 1 });
    const executionOrder: string[] = [];

    const createTask = (id: string) => async () => {
      executionOrder.push(id);
      return id;
    };

    workflow.addTask('low', createTask('low'), 1);
    workflow.addTask('high', createTask('high'), 10);
    workflow.addTask('medium', createTask('medium'), 5);

    await workflow.start();

    expect(executionOrder).toEqual(['high', 'medium', 'low']);
  });

  it('emits taskComplete and taskError events', async () => {
    const workflow = new Workflow<string>({ concurrency: 1 });
    const completeSpy = vi.fn();
    const errorSpy = vi.fn();

    workflow.on('taskComplete', completeSpy);
    workflow.on('taskError', errorSpy);

    workflow.addTask('success', async () => 'ok');
    workflow.addTask('fail', async () => {
      throw new Error('boom');
    });

    await workflow.start();

    expect(completeSpy).toHaveBeenCalledWith('success', 'ok');
    expect(errorSpy).toHaveBeenCalledWith('fail', expect.any(Error));
  });

  it('pause and resume control execution', async () => {
    const workflow = new Workflow<number>({ concurrency: 1 });
    let completed = 0;

    workflow.addTask('task-1', async () => {
      completed++;
      return 1;
    });
    workflow.addTask('task-2', async () => {
      completed++;
      return 2;
    });

    const startPromise = workflow.start();

    await new Promise((resolve) => setTimeout(resolve, 10));
    workflow.pause();

    const pausedCount = completed;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(completed).toBe(pausedCount);

    workflow.resume();
    await startPromise;
    expect(completed).toBe(2);
  });

  it('getStats returns accurate counts', async () => {
    const workflow = new Workflow<string>({ concurrency: 2 });

    workflow.addTask('task-1', async () => 'ok');
    workflow.addTask('task-2', async () => {
      throw new Error('fail');
    });

    await workflow.start();

    const stats = workflow.getStats();
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
  });
});
