/**
 * Service for integrating with the core tagging functionality
 */
import { initializeCore } from '@obsidian-magic/core';
import { APIError } from '@obsidian-magic/core/errors/APIError';
import { ApiKeyError } from '@obsidian-magic/core/errors/ApiKeyError';
import { FileSystemError } from '@obsidian-magic/core/errors/FileSystemError';
import { Result } from '@obsidian-magic/core/errors/Result';
import { TaggingError } from '@obsidian-magic/core/errors/TaggingError';
import { withRetry } from '@obsidian-magic/core/errors/retry';
import { BehaviorSubject, Subject } from '@obsidian-magic/core/utils/observable';

import type { Document } from '@obsidian-magic/core/models/Document';
import type { TagSet } from '@obsidian-magic/core/models/TagSet';
import type { TaggingOptions } from '@obsidian-magic/core/models/TaggingOptions';
import type { TFile } from 'obsidian';

import type ObsidianMagicPlugin from '../main';

/**
 * Error types specific to the tagging service
 */
export type TaggingServiceErrorCode =
  | 'API_KEY_MISSING'
  | 'FILE_ACCESS_ERROR'
  | 'PROCESSING_ERROR'
  | 'API_ERROR'
  | 'UNEXPECTED_ERROR';

/**
 * Generic error details interface
 */
export interface ErrorDetails {
  code: TaggingServiceErrorCode;
  message: string;
  recoverable: boolean;
}

/**
 * Result type for file processing operations
 */
export type FileProcessingResult = Result<{
  file: TFile;
  tags?: TagSet | undefined;
}>;

/**
 * Tagging service for Obsidian integration
 */
export class TaggingService {
  /**
   * Status updates emitted for UI handlers
   */
  public readonly status: BehaviorSubject<string> = new BehaviorSubject<string>('Magic: Ready');
  /**
   * Notice messages emitted for UI handlers
   */
  public readonly notice: Subject<string> = new Subject<string>();
  private plugin: ObsidianMagicPlugin;
  private coreServices: ReturnType<typeof initializeCore>;

  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;

    // Initialize core services
    this.coreServices = initializeCore({
      openaiApiKey: plugin.settings.apiKey,
      model: plugin.settings.modelPreference,
    });
  }

  /**
   * Update API key when settings change
   */
  updateApiKey(apiKey: string): void {
    this.coreServices.openAIClient.setApiKey(apiKey);
  }

  /**
   * Update AI model when settings change
   */
  updateModel(model: TaggingOptions['model']): void {
    this.coreServices.openAIClient.setModel(model);
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.plugin.settings.apiKey;
  }

  /**
   * Process a single file
   */
  async processFile(file: TFile): Promise<FileProcessingResult> {
    try {
      // Check if API key is configured
      if (!this.isConfigured()) {
        throw new ApiKeyError('OpenAI API key is not configured');
      }
      // Emit processing status
      this.status.next('Magic: Processing file...');

      // Read file content
      let content: string;
      try {
        content = await this.plugin.app.vault.read(file);
      } catch (err) {
        throw new FileSystemError(`Could not read file: ${(err as Error).message}`, {
          path: file.path,
        });
      }

      // Parse document
      const document: Document = this.coreServices.documentProcessor.parseDocument(file.path, file.basename, content);

      // Tag document with retry for transient errors
      const result = await withRetry(() => this.coreServices.taggingService.tagDocument(document), {
        maxRetries: 3,
        initialDelay: 1000,
      });

      if (!result.success) {
        throw new TaggingError(result.error?.message ?? 'Unknown tagging error');
      }

      // Update file with new tags
      try {
        // Only update if we have tags and the behavior isn't 'suggest'
        if (result.tags && this.plugin.settings.defaultTagBehavior !== 'suggest') {
          const updatedContent = this.coreServices.documentProcessor.updateDocument(document, result.tags);

          // Write back to file
          await this.plugin.app.vault.modify(file, updatedContent);
        }

        // Emit success notice and reset status
        this.notice.next('Successfully tagged document');
        this.status.next('Magic: Ready');

        return Result.ok({
          file,
          tags: result.tags,
        });
      } catch (writeErr) {
        throw new FileSystemError(`Could not update file: ${(writeErr as Error).message}`, {
          path: file.path,
        });
      }
    } catch (error) {
      // Emit ready status
      this.status.next('Magic: Ready');

      // Emit error notices
      if (error instanceof ApiKeyError) {
        this.notice.next('API key missing: Please add your OpenAI API key in settings');
      } else if (error instanceof APIError) {
        this.notice.next(
          `API Error: ${error.message}. ${error.statusCode === 429 ? 'Rate limit exceeded, try again later.' : ''}`
        );
      } else if (error instanceof FileSystemError) {
        this.notice.next(`File error: ${error.message}`);
      } else {
        this.notice.next(`Error tagging document: ${error instanceof Error ? error.message : String(error)}`);
      }

      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Process multiple files with configurable concurrency
   */
  async processFiles(files: TFile[], concurrency = 3): Promise<FileProcessingResult[]> {
    // Control concurrency with a simple pool
    const results: FileProcessingResult[] = [];
    const queue = [...files];
    const inProgress = new Set<Promise<FileProcessingResult>>();

    // Process queue with controlled concurrency
    while (queue.length > 0 || inProgress.size > 0) {
      // Fill the pool to concurrency limit
      while (queue.length > 0 && inProgress.size < concurrency) {
        const file = queue.shift();
        if (!file) continue;

        const promise = this.processFile(file);
        inProgress.add(promise);

        // When complete, remove from in-progress and store result
        void promise.then((result) => {
          inProgress.delete(promise);
          results.push(result);

          // Update progress
          const total = files.length;
          const completed = results.length;
          const percent = Math.round((completed / total) * 100);

          if (this.plugin.statusBarElement) {
            this.plugin.statusBarElement.setText(`Magic: Processing files (${String(percent)}%)...`);
          }
        });
      }

      // Wait for at least one promise to complete
      if (inProgress.size >= concurrency || (queue.length === 0 && inProgress.size > 0)) {
        await Promise.race(inProgress);
      }
    }

    // Reset status
    if (this.plugin.statusBarElement) {
      this.plugin.statusBarElement.setText('Magic: Ready');
    }

    return results;
  }
}
