/**
 * Service for integrating with the core tagging functionality
 */
import {
  ApiError,
  ApiKeyError,
  TaggingService as CoreTaggingService,
  DocumentProcessor,
  FileSystemError,
  OpenAIClient,
  TaggingError,
  failure,
  success,
  withRetry,
} from '@obsidian-magic/core';
import { Notice } from 'obsidian';

import type { Result } from '@obsidian-magic/core';
import type { Document, TagSet, TaggingOptions } from '@obsidian-magic/types';
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
export interface FileProcessingResult
  extends Result<{
    file: TFile;
    tags?: TagSet | undefined;
  }> {}

/**
 * Tagging service for Obsidian integration
 */
export class TaggingService {
  private plugin: ObsidianMagicPlugin;
  private openAIClient: OpenAIClient;
  private coreTaggingService: CoreTaggingService;
  private documentProcessor: DocumentProcessor;

  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;

    // Initialize OpenAI client with API key from plugin settings
    this.openAIClient = new OpenAIClient({
      apiKey: plugin.settings.apiKey,
      model: plugin.settings.modelPreference,
    });

    // Initialize core tagging service
    this.coreTaggingService = new CoreTaggingService(this.openAIClient, {
      model: plugin.settings.modelPreference,
      behavior: plugin.settings.defaultTagBehavior,
      minConfidence: 0.65,
      reviewThreshold: 0.85,
      generateExplanations: true,
    });

    // Initialize document processor
    this.documentProcessor = new DocumentProcessor({
      preserveExistingTags:
        plugin.settings.defaultTagBehavior === 'append' || plugin.settings.defaultTagBehavior === 'merge',
      tagsKey: 'tags',
      useNestedKeys: false,
    });
  }

  /**
   * Update API key when settings change
   */
  updateApiKey(apiKey: string): void {
    this.openAIClient.setApiKey(apiKey);
  }

  /**
   * Update AI model when settings change
   */
  updateModel(model: TaggingOptions['model']): void {
    this.openAIClient.setModel(model);
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

      // Update status
      if (this.plugin.statusBarElement) {
        this.plugin.statusBarElement.setText('Magic: Processing file...');
      }

      // Read file content
      let content: string;
      try {
        content = await this.plugin.app.vault.read(file);
      } catch (err) {
        throw new FileSystemError(`Could not read file: ${(err as Error).message}`, file.path);
      }

      // Parse document
      const document: Document = this.documentProcessor.parseDocument(file.path, file.basename, content);

      // Tag document with retry for transient errors
      const result = await withRetry(() => this.coreTaggingService.tagDocument(document), {
        maxRetries: 3,
        initialDelay: 1000,
      });

      if (!result.success) {
        throw new TaggingError(result.error?.message || 'Unknown tagging error');
      }

      // Update file with new tags
      try {
        // Only update if we have tags and the behavior isn't 'suggest'
        if (result.tags && this.plugin.settings.defaultTagBehavior !== ('suggest' as any)) {
          const updatedContent = this.documentProcessor.updateDocument(document, result.tags);

          // Write back to file
          await this.plugin.app.vault.modify(file, updatedContent);
        }

        // Show success notice
        new Notice('Successfully tagged document');

        // Reset status
        if (this.plugin.statusBarElement) {
          this.plugin.statusBarElement.setText('Magic: Ready');
        }

        return success({
          file,
          tags: result.tags,
        }) as FileProcessingResult;
      } catch (writeErr) {
        throw new FileSystemError(`Could not update file: ${(writeErr as Error).message}`, file.path);
      }
    } catch (error) {
      // Reset status
      if (this.plugin.statusBarElement) {
        this.plugin.statusBarElement.setText('Magic: Ready');
      }

      // Show error notice with actionable advice
      if (error instanceof ApiKeyError) {
        new Notice('API key missing: Please add your OpenAI API key in settings');
      } else if (error instanceof ApiError) {
        new Notice(
          `API Error: ${error.message}. ${error.statusCode === 429 ? 'Rate limit exceeded, try again later.' : ''}`
        );
      } else if (error instanceof FileSystemError) {
        new Notice(`File error: ${error.message}`);
      } else {
        new Notice(`Error tagging document: ${error instanceof Error ? error.message : String(error)}`);
      }

      return failure(error instanceof Error ? error : new Error(String(error)));
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
        const file = queue.shift()!;
        const promise = this.processFile(file);
        inProgress.add(promise);

        // When complete, remove from in-progress and store result
        promise.then((result) => {
          inProgress.delete(promise);
          results.push(result);

          // Update progress
          const total = files.length;
          const completed = results.length;
          const percent = Math.round((completed / total) * 100);

          if (this.plugin.statusBarElement) {
            this.plugin.statusBarElement.setText(`Magic: Processing files (${percent}%)...`);
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
