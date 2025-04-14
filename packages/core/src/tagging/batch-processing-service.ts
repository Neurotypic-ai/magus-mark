/**
 * Batch processing service for tagging multiple documents
 */
import type { Document, TaggingOptions, TaggingResult } from '../models/api';
import type { TaggingService } from '../tagging-service';

/**
 * Options for batch processing
 */
export interface BatchProcessingOptions {
  /**
   * Maximum number of concurrent requests to the OpenAI API
   */
  concurrency: number;

  /**
   * Whether to continue processing if a document fails
   */
  continueOnError: boolean;

  /**
   * Callback for progress updates
   */
  onProgress?: (completed: number, total: number, current?: Document) => void;

  /**
   * Callback for error handling
   */
  onError?: (error: Error, document?: Document) => void;

  /**
   * Tagging options to use for all documents
   */
  taggingOptions?: Partial<TaggingOptions>;
}

/**
 * Default batch processing options
 */
export const DEFAULT_BATCH_OPTIONS: BatchProcessingOptions = {
  concurrency: 3,
  continueOnError: true,
};

/**
 * Extended tagging result with usage information
 */
interface ExtendedTaggingResult extends TaggingResult {
  usage?: {
    totalTokens: number;
    estimatedCost: number;
  };
}

/**
 * Results of batch processing
 */
export interface BatchProcessingResult {
  /**
   * Results for each document
   */
  results: {
    document: Document;
    result: TaggingResult;
  }[];

  /**
   * Documents that failed processing
   */
  errors: {
    document: Document;
    error: Error;
  }[];

  /**
   * Summary of the batch operation
   */
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTokensUsed: number;
    estimatedCost: number;
    processingTimeMs: number;
  };
}

/**
 * Service for batch processing multiple documents
 */
export class BatchProcessingService {
  private taggingService: TaggingService;
  private options: BatchProcessingOptions;

  constructor(taggingService: TaggingService, options: Partial<BatchProcessingOptions> = {}) {
    this.taggingService = taggingService;
    this.options = { ...DEFAULT_BATCH_OPTIONS, ...options };
  }

  /**
   * Process a batch of documents
   */
  async processBatch(documents: Document[]): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const results: BatchProcessingResult['results'] = [];
    const errors: BatchProcessingResult['errors'] = [];
    let totalTokensUsed = 0;
    let estimatedCost = 0;

    // Process documents in parallel based on concurrency limit
    const queue = [...documents];
    const inProgress = new Set<Promise<void>>();

    while (queue.length > 0 || inProgress.size > 0) {
      // Fill up to concurrency limit
      while (queue.length > 0 && inProgress.size < this.options.concurrency) {
        const document = queue.shift();

        // Skip if document is undefined (shouldn't happen, but for type safety)
        if (!document) continue;

        const promise = this.processDocument(document)
          .then((result) => {
            if (result.success) {
              results.push({ document, result });

              // Track token usage if available
              const extendedResult = result as ExtendedTaggingResult;
              if (extendedResult.usage) {
                totalTokensUsed += extendedResult.usage.totalTokens;
                estimatedCost += extendedResult.usage.estimatedCost;
              }
            } else {
              // Handle error
              const error = new Error(result.error?.message ?? 'Unknown error');
              errors.push({ document, error });

              if (this.options.onError) {
                this.options.onError(error, document);
              }

              // If not continuing on error, reject the promise
              if (!this.options.continueOnError) {
                throw error;
              }
            }

            // Progress callback
            if (this.options.onProgress) {
              const completed = results.length + errors.length;
              const total = documents.length;
              this.options.onProgress(completed, total);
            }

            // Remove from in-progress set
            inProgress.delete(promise);
          })
          .catch((error: unknown) => {
            // Handle unexpected errors
            const processedError = error instanceof Error ? error : new Error(String(error));
            errors.push({ document, error: processedError });

            if (this.options.onError) {
              this.options.onError(processedError, document);
            }

            // If not continuing on error, re-throw
            if (!this.options.continueOnError) {
              throw processedError;
            }

            // Remove from in-progress set
            inProgress.delete(promise);
          });

        // Add to in-progress set
        inProgress.add(promise);
      }

      // Wait for at least one promise to complete if we've reached concurrency limit
      if (inProgress.size >= this.options.concurrency || (queue.length === 0 && inProgress.size > 0)) {
        await Promise.race(inProgress);
      }
    }

    const processingTimeMs = Date.now() - startTime;

    // Generate summary
    const summary = {
      total: documents.length,
      successful: results.length,
      failed: errors.length,
      totalTokensUsed,
      estimatedCost,
      processingTimeMs,
    };

    return { results, errors, summary };
  }

  /**
   * Process a single document
   */
  private async processDocument(document: Document): Promise<TaggingResult> {
    try {
      // Call tagging service with document
      const result = await this.taggingService.tagDocument(document);
      return result;
    } catch (error) {
      // Handle unexpected errors
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BATCH_PROCESSING_ERROR',
          recoverable: false,
        },
      };
    }
  }

  /**
   * Estimate the batch processing cost without executing it
   */
  estimateBatchCost(documents: Document[]): {
    estimatedTokens: number;
    estimatedCost: number;
    estimatedTimeMinutes: number;
  } {
    // Rough estimation based on document sizes
    const averageTokensPerCharacter = 0.25; // Rough estimate of tokens per character
    const totalCharacters = documents.reduce((sum, doc) => sum + (doc.content.length || 0), 0);
    const estimatedPromptTokens = totalCharacters * averageTokensPerCharacter;

    // Estimate completion tokens (typically smaller than prompt)
    const estimatedCompletionTokens = documents.length * 500; // Rough estimate of tokens per response

    const totalEstimatedTokens = estimatedPromptTokens + estimatedCompletionTokens;

    // Estimate cost based on gpt-4o pricing ($0.01 per 1K tokens)
    const estimatedCost = (totalEstimatedTokens / 1000) * 0.01;

    // Estimate time based on API response time and concurrency
    const averageTimePerDocument = 5; // seconds
    const estimatedTimeTotalSeconds = (documents.length / this.options.concurrency) * averageTimePerDocument;
    const estimatedTimeMinutes = estimatedTimeTotalSeconds / 60;

    return {
      estimatedTokens: Math.ceil(totalEstimatedTokens),
      estimatedCost: parseFloat(estimatedCost.toFixed(2)),
      estimatedTimeMinutes: parseFloat(estimatedTimeMinutes.toFixed(1)),
    };
  }

  /**
   * Set batch processing options
   */
  setOptions(options: Partial<BatchProcessingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current batch processing options
   */
  getOptions(): BatchProcessingOptions {
    return { ...this.options };
  }
}
