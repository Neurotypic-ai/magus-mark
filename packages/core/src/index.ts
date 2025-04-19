/**
 * Core functionality for Obsidian Magic
 *
 * This module contains shared business logic for the tagging system,
 * OpenAI integration, markdown parsing, and other core features.
 */

// Explicit imports with full paths to avoid barrel files
import { DocumentProcessor } from './markdown/DocumentProcessor';
import { OpenAIClient } from './openai/OpenAIClient';
import { TaggingService } from './openai/TaggingService';
import { BatchProcessingService } from './tagging/BatchProcessingService';
import { TaxonomyManager } from './tagging/TaxonomyManager';

import type { AIModel } from './models/AIModel';

// Export version information
export const VERSION = '0.1.0';

export type CoreModuleOptions = {
  openaiApiKey?: string;
  model?: AIModel;
  taxonomy?: Record<string, unknown>;
};

export type CoreModule = {
  openAIClient: OpenAIClient;
  taxonomyManager: TaxonomyManager;
  taggingService: TaggingService;
  documentProcessor: DocumentProcessor;
  batchProcessingService: BatchProcessingService;
};
/**
 * Initialize the core module with configuration
 *
 * @param options Configuration options for the core module
 * @returns Core functionality instances
 */
export function initializeCore(options: CoreModuleOptions): CoreModule {
  // Initialize OpenAI client
  const openAIClient: OpenAIClient = new OpenAIClient({
    apiKey: options.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? '',
    model: options.model ?? 'gpt-4o',
  });

  // Initialize taxonomy manager
  const taxonomyManager: TaxonomyManager = new TaxonomyManager(options.taxonomy);

  // Initialize tagging service
  const taggingService: TaggingService = new TaggingService(
    openAIClient,
    {}, // Default tagging options
    taxonomyManager.getTaxonomyForPrompt()
  );

  // Initialize document processor
  const documentProcessor: DocumentProcessor = new DocumentProcessor();

  // Initialize batch processing service
  const batchProcessingService: BatchProcessingService = new BatchProcessingService(taggingService);

  const coreModule: CoreModule = {
    openAIClient,
    taxonomyManager,
    taggingService,
    documentProcessor,
    batchProcessingService,
  };
  return coreModule;
}
