/**
 * Core functionality for Obsidian Magic
 * 
 * This package provides the shared business logic for Obsidian Magic,
 * including tag classification, OpenAI integration, and markdown processing.
 */

// Export tagging functionality
export * from './tagging';
export * from './tagging/taxonomy';
export * from './tagging/batch';

// Export OpenAI integration
export * from './openai';
export * from './openai/prompts';

// Export markdown processing
export * from './markdown';

// Export errors
export * from './errors';

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
  model?: string;
  taxonomy?: Record<string, unknown>;
}) {
  // Import modules dynamically to avoid circular dependencies
  const { OpenAIClient } = require('./openai');
  const { TaggingService } = require('./tagging');
  const { TaxonomyManager } = require('./tagging/taxonomy');
  const { DocumentProcessor } = require('./markdown');
  const { BatchProcessingService } = require('./tagging/batch');
  
  // Initialize OpenAI client
  const openAIClient = new OpenAIClient({
    apiKey: options.openaiApiKey || process.env['OPENAI_API_KEY'],
    model: options.model || 'gpt-4o'
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
    batchProcessingService
  };
}
