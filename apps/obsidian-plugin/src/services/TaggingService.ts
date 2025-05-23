/**
 * Service for integrating with the core tagging functionality
 */
import { Notice } from 'obsidian';

import { initializeCore } from '@magus-mark/core';
import { APIError } from '@magus-mark/core/errors/APIError';
import { ApiKeyError } from '@magus-mark/core/errors/ApiKeyError';
import { FileSystemError } from '@magus-mark/core/errors/FileSystemError';
import { Result } from '@magus-mark/core/errors/Result';
import { TaggingError } from '@magus-mark/core/errors/TaggingError';
import { withRetry } from '@magus-mark/core/errors/retry';
import { BehaviorSubject, Subject } from '@magus-mark/core/utils/observable';

import { ApiKeyHelpModal } from '../ui/ApiKeyHelpModal';

import type { Document } from '@magus-mark/core/models/Document';
import type { TagSet } from '@magus-mark/core/models/TagSet';
import type { TaggingOptions } from '@magus-mark/core/models/TaggingOptions';
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

      // Get the error message and handle specific error cases
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStr = String(error);

      // Handle specific API error cases
      if (error instanceof ApiKeyError) {
        this.notice.next('API key missing: Please add your OpenAI API key in settings');
      } else if (error instanceof APIError) {
        // Handle specific OpenAI API errors
        if (error.statusCode === 401) {
          // Handle 401 unauthorized errors - likely insufficient permissions
          if (errorStr.includes('model.request') || errorStr.includes('insufficient permissions')) {
            this.showApiPermissionError();
          } else if (errorStr.includes('invalid_api_key')) {
            this.notice.next('API Key Error: Your API key is invalid. Please check it in settings.');
          } else {
            this.notice.next(
              'API Key Error: Authentication failed. Please check your API key or OpenAI account permissions.'
            );
          }
        } else if (error.statusCode === 429) {
          this.notice.next('Rate limit exceeded: Please wait a few minutes before trying again.');
        } else if (error.statusCode && error.statusCode >= 500) {
          this.notice.next('OpenAI server error: Their servers are experiencing issues. Please try again later.');
        } else {
          this.notice.next(`API Error: ${error.message}`);
        }
      } else if (error instanceof FileSystemError) {
        this.notice.next(`File error: ${error.message}`);
      } else if (error instanceof TaggingError) {
        // Handle tagging-specific errors
        if (errorStr.includes('model.request') || errorStr.includes('insufficient permissions')) {
          this.showApiPermissionError();
        } else if (errorStr.includes('filter') && errorStr.includes('undefined')) {
          // Handle the specific "Cannot read properties of undefined (reading 'filter')" error
          this.notice.next(
            'Error processing API response: Received unexpected data format from OpenAI. Please try again or check your API key permissions.'
          );
        } else {
          this.notice.next(`Tagging error: ${error.message}`);
        }
      } else if (errorStr.includes('filter') && errorStr.includes('undefined')) {
        // Also catch the error outside of known error types
        this.notice.next(
          'Error processing API response: Received unexpected data format from OpenAI. Please try again or check your API key permissions.'
        );
      } else {
        this.notice.next(`Error tagging document: ${errorMessage}`);
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

  /**
   * Show API permission error with help button
   */
  private showApiPermissionError(): void {
    // Create a custom notice with a help button
    const notice = new Notice('', 12000);

    // Replace the notice content with custom HTML
    const container = notice.messageEl.querySelector('.notice-content');
    if (container) {
      // Clear existing content
      container.empty();

      // Add message
      container.createSpan({
        text: 'API Key Error: You have insufficient permissions. Your API key needs the "model.request" scope.',
      });

      // Add a spacer
      container.createSpan({ text: ' ' });

      // Add help button
      const helpButton = container.createEl('button', {
        text: 'Help',
        cls: 'mod-cta',
        attr: {
          style: 'padding: 2px 8px; margin-left: 8px;',
        },
      });

      // Add click handler to open help modal
      helpButton.addEventListener('click', () => {
        notice.hide();
        new ApiKeyHelpModal(this.plugin).open();
      });
    }
  }
}
