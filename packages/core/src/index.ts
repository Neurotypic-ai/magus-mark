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

import type { AIModel } from './models/api';

// Export version information
export const VERSION = '0.1.0';

/**
 * Initialize the core module with configuration
 *
 * @param options Configuration options for the core module
 * @returns Core functionality instances
 */
export function initializeCore(options: {
  openaiApiKey?: string;
  model?: AIModel;
  taxonomy?: Record<string, unknown>;
}) {
  // Initialize OpenAI client
  const openAIClient = new OpenAIClient({
    apiKey: options.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? '',
    model: options.model ?? 'gpt-4o',
  });

  // Initialize taxonomy manager
  const taxonomyManager = new TaxonomyManager(options.taxonomy);

  // Initialize tagging service
  const taggingService = new TaggingService(
    openAIClient,
    {}, // Default tagging options
    taxonomyManager.getTaxonomyForPrompt()
  );

  // Initialize document processor
  const documentProcessor = new DocumentProcessor();

  // Initialize batch processing service
  const batchProcessingService = new BatchProcessingService(taggingService);

  return {
    openAIClient,
    taxonomyManager,
    taggingService,
    documentProcessor,
    batchProcessingService,
  };
}
