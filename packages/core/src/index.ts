/**
 * Core functionality for Obsidian Magic
 *
 * This module contains shared business logic for the tagging system,
 * OpenAI integration, markdown parsing, and other core features.
 */

// Export all components from the core module
export * from './errors';
export * from './markdown';
export * from './openai';
export * from './tagging';

// Export tagging functionality
export * from './tagging/taxonomy';
export * from './tagging/batch';

// Export version information
export const VERSION = '0.1.0';

/**
 * Initialize the core module with configuration
 *
 * @param options Configuration options for the core module
 * @returns Core functionality instances
 */
export async function initializeCore(options: {
  openaiApiKey?: string;
  model?: string;
  taxonomy?: Record<string, unknown>;
}) {
  // Import needed classes - using the exports we already have
  // This avoids circular dependencies while allowing static type checking
  const { OpenAIClient } = await import('./openai');
  const { TaggingService } = await import('./tagging');
  const { TaxonomyManager } = await import('./tagging/taxonomy');
  const { DocumentProcessor } = await import('./markdown');
  const { BatchProcessingService } = await import('./tagging/batch');

  // Initialize OpenAI client
  const openAIClient = new OpenAIClient({
    apiKey: options.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? '',
    model: (options.model ?? 'gpt-4o') as any, // Type assertion needed for string to AIModel
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
