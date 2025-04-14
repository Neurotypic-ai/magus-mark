/**
 * Core functionality for Obsidian Magic
 *
 * This module contains shared business logic for the tagging system,
 * OpenAI integration, markdown parsing, and other core features.
 */

// Export model calculation function from openai-models
import { calculateCost as calcCost } from './openai-models';

import type { AIModel } from '@obsidian-magic/types';

// Export all components from the core module
export * from './errors';
export * from './openai-client';
export * from './tagging-service';
export * from './openai-models';
export * from './model-manager';
  
// Export tagging functionality
export * from './markdown/frontmatter-processor';
export * from './markdown/document-processor';
export * from './tagging/taxonomy-manager';
export * from './tagging/batch-processing-service';

// Export validators
export * from './validators/api-validators';
export * from './validators/tags-validators';

// Export openai utilities
export * from './openai/prompts';

// Export version information
export const VERSION = '0.1.0';

export const calculateCost = calcCost;

/**
 * Initialize the core module with configuration
 *
 * @param options Configuration options for the core module
 * @returns Core functionality instances
 */
export async function initializeCore(options: {
  openaiApiKey?: string;
  model?: AIModel;
  taxonomy?: Record<string, unknown>;
}) {
  // Import needed classes - using the exports we already have
  // This avoids circular dependencies while allowing static type checking
  const { OpenAIClient } = await import('./openai-client');
  const { TaggingService } = await import('./tagging-service');
  const { TaxonomyManager } = await import('./tagging/taxonomy-manager');
  const { DocumentProcessor } = await import('./markdown/document-processor');
  const { BatchProcessingService } = await import('./tagging/batch-processing-service');

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
