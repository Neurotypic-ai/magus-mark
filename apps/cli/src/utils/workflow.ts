import { EventEmitter } from 'events';

import { Logger } from '@magus-mark/core/utils/Logger';

const logger = Logger.getInstance('Workflow');
/**
 * Task status type
 */
type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

/**
 * Task interface
 */
interface Task<T> {
  id: string;
  status: TaskStatus;
  priority: number;
  fn: () => Promise<T>;
  result?: T;
  error?: Error;
}

/**
 * Workflow options
 */
interface WorkflowOptions {
  concurrency: number;
  batchSize?: number;
  retryCount?: number;
  retryDelay?: number;
  pauseOnError?: boolean;
}

/**
 * Workflow events
 */
export interface WorkflowEvents<T> {
  taskStart: (taskId: string) => void;
  taskComplete: (taskId: string, result: T) => void;
  taskError: (taskId: string, error: Error) => void;
  taskSkip: (taskId: string) => void;
  queueEmpty: () => void;
  workflowComplete: (results: Record<string, T>) => void;
  workflowError: (error: Error) => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Workflow processor for managing concurrent task execution
 */
export class Workflow<T> extends EventEmitter {
  private tasks = new Map<string, Task<T>>();
  private queue: string[] = [];
  private processing = new Set<string>();
  private results: Record<string, T> = {};
  private errors: Record<string, Error> = {};
  private paused = false;
  private completed = false;
  private activeCount = 0;
  private options: WorkflowOptions;

  /**
   * Create a new workflow
   */
  constructor(options: Partial<WorkflowOptions> = {}) {
    super();
    this.options = {
      concurrency: 3,
      batchSize: 10,
      retryCount: 2,
      retryDelay: 1000,
      pauseOnError: false,
      ...options,
    };
  }

  /**
   * Add a task to the workflow
   */
  addTask(id: string, fn: () => Promise<T>, priority = 0): this {
    if (this.tasks.has(id)) {
      logger.warn(`Task with ID ${id} already exists. Skipping.`);
      return this;
    }

    this.tasks.set(id, {
      id,
      status: 'pending',
      priority,
      fn,
    });

    this.queue.push(id);

    // Sort the queue by priority (highest first)
    this.queue.sort((a, b) => {
      const taskA = this.tasks.get(a);
      const taskB = this.tasks.get(b);

      if (!taskA || !taskB) return 0;

      return taskB.priority - taskA.priority;
    });

    return this;
  }

  /**
   * Start the workflow
   */
  async start(): Promise<Record<string, T>> {
    if (this.queue.length === 0) {
      logger.warn('No tasks to process.');
      this.completed = true;
      this.emit('workflowComplete', {});
      return {};
    }

    logger.info(
      `Starting workflow with ${String(this.queue.length)} tasks and concurrency ${String(this.options.concurrency)}`
    );

    // Start initial batch of tasks based on concurrency
    this.processNextBatch();

    // Wait for all tasks to complete
    return new Promise<Record<string, T>>((resolve, reject) => {
      this.on('workflowComplete', (results: Record<string, T>) => {
        resolve(results);
      });

      this.on('workflowError', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Pause the workflow
   */
  pause(): void {
    if (!this.paused) {
      this.paused = true;
      logger.info('Workflow paused.');
      this.emit('pause');
    }
  }

  /**
   * Resume the workflow
   */
  resume(): void {
    if (this.paused) {
      this.paused = false;
      logger.info('Workflow resumed.');
      this.emit('resume');
      this.processNextBatch();
    }
  }

  /**
   * Cancel the workflow
   */
  cancel(): void {
    logger.info('Workflow cancelled.');
    this.queue = [];
    this.emit('workflowComplete', this.results);
  }

  /**
   * Get workflow statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    skipped: number;
  } {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;
    let skipped = 0;

    this.tasks.forEach((task) => {
      switch (task.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'skipped':
          skipped++;
          break;
      }
    });

    return {
      total: this.tasks.size,
      pending,
      processing,
      completed,
      failed,
      skipped,
    };
  }

  /**
   * Process the next batch of tasks
   */
  private processNextBatch(): void {
    if (this.paused || this.completed) return;

    // Calculate how many more tasks can be processed concurrently
    const available = this.options.concurrency - this.activeCount;

    if (available <= 0) return;

    // Get the next batch of tasks
    const batchSize = Math.min(available, this.options.batchSize ?? available);
    const batch = this.queue.splice(0, batchSize);

    if (batch.length === 0) {
      if (this.activeCount === 0) {
        this.completed = true;
        this.emit('queueEmpty');
        this.emit('workflowComplete', this.results);
      }
      return;
    }

    // Process each task in the batch
    for (const taskId of batch) {
      void this.processTask(taskId);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);

    if (!task) return;

    task.status = 'processing';
    this.processing.add(taskId);
    this.activeCount++;

    this.emit('taskStart', taskId);

    try {
      const result = await task.fn();

      task.status = 'completed';
      task.result = result;
      this.results[taskId] = result;

      this.emit('taskComplete', taskId, result);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error : new Error(String(error));
      this.errors[taskId] = task.error;

      if (this.options.pauseOnError) {
        this.pause();
      }

      this.emit('taskError', taskId, task.error);
    } finally {
      this.processing.delete(taskId);
      this.activeCount--;

      // Process the next batch of tasks
      this.processNextBatch();
    }
  }
}
