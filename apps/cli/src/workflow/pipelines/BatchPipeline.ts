import { EventEmitter } from 'events';

import { Logger } from '@magus-mark/core/utils/Logger';

export interface PipelineStage<TInput, TOutput> {
  name: string;
  description: string;
  processor: (input: TInput) => Promise<TOutput>;
  retryCount?: number;
  timeout?: number;
}

export interface PipelineConfig {
  name: string;
  concurrency: number;
  retryDelay: number;
  timeout: number;
  stopOnError: boolean;
}

export interface PipelineStats {
  processed: number;
  successful: number;
  failed: number;
  retries: number;
  averageProcessingTime: number;
  startTime: Date;
  endTime?: Date;
}

export class BatchPipeline<TInput, TOutput> extends EventEmitter {
  private stages: PipelineStage<unknown, unknown>[] = [];
  private config: PipelineConfig;
  private stats: PipelineStats;
  private logger: Logger;
  private isRunning = false;

  constructor(config: PipelineConfig) {
    super();
    this.config = config;
    this.logger = Logger.getInstance(`pipeline:${config.name}`);
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      retries: 0,
      averageProcessingTime: 0,
      startTime: new Date(),
    };
  }

  addStage<TStageInput, TStageOutput>(stage: PipelineStage<TStageInput, TStageOutput>): this {
    if (this.isRunning) {
      throw new Error('Cannot add stages while pipeline is running');
    }

    this.stages.push(stage as PipelineStage<unknown, unknown>);
    this.logger.debug(`Added stage: ${stage.name}`);
    return this;
  }

  async process(inputs: TInput[]): Promise<TOutput[]> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    this.isRunning = true;
    this.stats.startTime = new Date();
    this.stats.processed = 0;
    this.stats.successful = 0;
    this.stats.failed = 0;

    this.logger.info(`Starting pipeline ${this.config.name} with ${inputs.length} inputs`);
    this.emit('pipeline:started', inputs.length);

    const results: TOutput[] = [];
    const processingTimes: number[] = [];

    // Process inputs with concurrency control
    const chunks = this.chunkArray(inputs, this.config.concurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (input, index) => {
        const startTime = Date.now();

        try {
          const result = await this.processInput(input, index);
          const processingTime = Date.now() - startTime;
          processingTimes.push(processingTime);

          this.stats.successful++;
          this.emit('pipeline:item:success', input, result, processingTime);
          return result;
        } catch (error) {
          this.stats.failed++;
          this.logger.error(
            `Failed to process input ${index}: ${error instanceof Error ? error.message : String(error)}`
          );
          this.emit('pipeline:item:error', input, error);

          if (this.config.stopOnError) {
            throw error;
          }

          return null;
        } finally {
          this.stats.processed++;
          this.emit('pipeline:progress', this.stats.processed, inputs.length);
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter((result): result is Awaited<TOutput> => result !== null) as TOutput[]);
    }

    // Calculate final stats
    this.stats.endTime = new Date();
    this.stats.averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;

    this.isRunning = false;
    this.logger.info(
      `Pipeline ${this.config.name} completed. ${this.stats.successful}/${this.stats.processed} successful`
    );
    this.emit('pipeline:completed', results, this.stats);

    return results;
  }

  private async processInput(input: TInput, index: number): Promise<TOutput> {
    let currentData: unknown = input;

    for (const [stageIndex, stage] of this.stages.entries()) {
      this.logger.debug(`Processing input ${index} through stage ${stageIndex + 1}: ${stage.name}`);

      let retryCount = 0;
      const maxRetries = stage.retryCount ?? 3;

      while (retryCount <= maxRetries) {
        try {
          const stageStartTime = Date.now();

          // Apply timeout if specified
          const stagePromise = stage.processor(currentData);
          const timeoutPromise = stage.timeout
            ? new Promise((_, reject) =>
                setTimeout(() => {
                  reject(new Error(`Stage ${stage.name} timed out`));
                }, stage.timeout)
              )
            : Promise.resolve();

          currentData = await Promise.race([stagePromise, timeoutPromise]);

          const stageTime = Date.now() - stageStartTime;
          this.logger.debug(`Stage ${stage.name} completed in ${stageTime}ms`);
          this.emit('pipeline:stage:completed', stage.name, currentData, stageTime);

          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          this.stats.retries++;

          this.logger.warn(
            `Stage ${stage.name} failed (attempt ${retryCount}/${maxRetries + 1}): ${error instanceof Error ? error.message : String(error)}`
          );

          if (retryCount > maxRetries) {
            throw error;
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    return currentData as TOutput;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  getStats(): PipelineStats {
    return { ...this.stats };
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
