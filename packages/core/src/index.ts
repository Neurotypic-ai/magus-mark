/**
 * Core functionality for Obsidian Magic
 * 
 * This package provides the shared business logic for Obsidian Magic,
 * including tag classification, OpenAI integration, and markdown processing.
 */

// Export tagging functionality
export * from './tagging';

// Export OpenAI integration
export * from './openai';

// Export markdown processing
export * from './markdown';

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
}) {
  // Initialize OpenAI client
  const { OpenAIClient } = require('./openai');
  const openAIClient = new OpenAIClient({
    apiKey: options.openaiApiKey || process.env['OPENAI_API_KEY'],
    model: options.model || 'gpt-4o'
  });
  
  // Initialize tagging service
  const { TaggingService } = require('./tagging');
  const taggingService = new TaggingService(openAIClient);
  
  // Initialize markdown processor
  const { DocumentProcessor } = require('./markdown');
  const documentProcessor = new DocumentProcessor();
  
  return {
    openAIClient,
    taggingService,
    documentProcessor
  };
}
