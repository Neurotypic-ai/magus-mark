import { EventEmitter } from 'events';

import { Logger } from '@magus-mark/core/utils/Logger';

export interface QueuedTask<T> {
  id: string;
  payload: T;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export interface TaskProcessor<T, R> {
  process: (task: T) => Promise<R>;
}

export interface QueueConfig {
  name: string;
  concurrency: number;
  retryDelay: number;
  maxRetries: number;
  processingTimeout: number;
}

export class TaskQueue<T, R> extends EventEmitter {
  private queue: QueuedTask<T>[] = [];
  private processing = new Set<string>();
  private completed = new Map<string, R>();
  private config: QueueConfig;
  private processor: TaskProcessor<T, R>;
  private logger: Logger;
  private isRunning = false;
  private isPaused = false;

  constructor(config: QueueConfig, processor: TaskProcessor<T, R>) {
    super();
    this.config = config;
    this.processor = processor;
    this.logger = Logger.getInstance(`queue:${config.name}`);
  }

  enqueue(id: string, payload: T, priority = 0): void {
    const task: QueuedTask<T> = {
      id,
      payload,
      priority,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: new Date(),
      status: 'pending',
    };

    this.queue.push(task);
    this.sortQueue();

    this.logger.debug(`Enqueued task ${id} with priority ${priority.toString()}`);
    this.emit('task:enqueued', task);

    // Auto-start processing if not running
    if (!this.isRunning && !this.isPaused) {
      void this.start();
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.logger.info(`Starting queue ${this.config.name} with concurrency ${this.config.concurrency.toString()}`);
    this.emit('queue:started');

    // Start concurrent workers
    const workers = Array.from({ length: this.config.concurrency }, (_, i) => this.worker(`worker-${i.toString()}`));

    await Promise.all(workers);

    this.isRunning = false;
    this.logger.info(`Queue ${this.config.name} completed`);
    this.emit('queue:completed');
  }

  pause(): void {
    this.isPaused = true;
    this.logger.info(`Queue ${this.config.name} paused`);
    this.emit('queue:paused');
  }

  resume(): void {
    this.isPaused = false;
    this.logger.info(`Queue ${this.config.name} resumed`);
    this.emit('queue:resumed');

    if (!this.isRunning && this.queue.length > 0) {
      void this.start();
    }
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.logger.info(`Queue ${this.config.name} stopped`);
    this.emit('queue:stopped');
  }

  private async worker(workerId: string): Promise<void> {
    while (this.isRunning) {
      if (this.isPaused) {
        await this.sleep(100);
        continue;
      }

      const task = this.getNextTask();
      if (!task) {
        // No tasks available, check if we should exit
        if (this.queue.length === 0 && this.processing.size === 0) {
          break;
        }
        await this.sleep(100);
        continue;
      }

      await this.processTask(task, workerId);
    }
  }

  private getNextTask(): QueuedTask<T> | null {
    const availableTask = this.queue.find((task) => task.status === 'pending' && !this.processing.has(task.id));

    if (availableTask) {
      availableTask.status = 'processing';
      availableTask.startedAt = new Date();
      this.processing.add(availableTask.id);
      return availableTask;
    }

    return null;
  }

  private async processTask(task: QueuedTask<T>, workerId: string): Promise<void> {
    this.logger.debug(`Worker ${workerId} processing task ${task.id}`);
    this.emit('task:started', task, workerId);

    try {
      // Apply processing timeout
      const processingPromise = this.processor.process(task.payload);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new Error('Processing timeout'));
        }, this.config.processingTimeout)
      );

      const result = await Promise.race([processingPromise, timeoutPromise]);

      task.status = 'completed';
      task.completedAt = new Date();
      this.completed.set(task.id, result);

      this.logger.debug(`Task ${task.id} completed successfully`);
      this.emit('task:completed', task, result);
    } catch (error) {
      task.error = error instanceof Error ? error : new Error(String(error));
      task.retryCount++;

      this.logger.warn(`Task ${task.id} failed (attempt ${task.retryCount.toString()}): ${task.error.message}`);

      if (task.retryCount < task.maxRetries) {
        // Retry the task
        task.status = 'pending';
        delete task.startedAt;
        this.logger.debug(`Retrying task ${task.id} (${task.retryCount.toString()}/${task.maxRetries.toString()})`);
        this.emit('task:retry', task);

        // Add delay before retry
        await this.sleep(this.config.retryDelay);
      } else {
        // Mark as failed
        task.status = 'failed';
        this.logger.error(`Task ${task.id} failed permanently after ${task.retryCount.toString()} attempts`);
        this.emit('task:failed', task, task.error);
      }
    } finally {
      this.processing.delete(task.id);
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Higher priority first, then by creation time
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats(): {
    processed: number;
    successful: number;
    failed: number;
    retries: number;
    averageProcessingTime: number;
    startTime: Date;
    endTime?: Date;
    queueLength: number;
    processing: number;
  } {
    // Calculate stats from queue
    const completed = this.queue.filter((t) => t.status === 'completed').length;
    const failed = this.queue.filter((t) => t.status === 'failed').length;
    const totalRetries = this.queue.reduce((sum, t) => sum + t.retryCount, 0);

    const completedTasks = this.queue.filter((t) => t.status === 'completed' && t.startedAt && t.completedAt);
    const avgTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => {
            if (t.completedAt && t.startedAt) {
              return sum + (t.completedAt.getTime() - t.startedAt.getTime());
            }
            return sum;
          }, 0) / completedTasks.length
        : 0;

    return {
      processed: this.queue.length,
      successful: completed,
      failed,
      retries: totalRetries,
      averageProcessingTime: avgTime,
      startTime: new Date(),
      queueLength: this.queue.length,
      processing: this.processing.size,
    };
  }

  getTask(id: string): QueuedTask<T> | undefined {
    return this.queue.find((task) => task.id === id);
  }

  getResult(id: string): R | undefined {
    return this.completed.get(id);
  }

  cancelTask(id: string): boolean {
    const task = this.queue.find((t) => t.id === id);
    if (task && task.status === 'pending') {
      task.status = 'cancelled';
      this.emit('task:cancelled', task);
      return true;
    }
    return false;
  }

  clear(): void {
    this.queue = [];
    this.processing.clear();
    this.completed.clear();
    this.emit('queue:cleared');
  }
}
