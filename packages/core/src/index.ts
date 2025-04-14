/**
 * Core functionality for Obsidian Magic
 *
 * This module contains shared business logic for the tagging system,
 * OpenAI integration, markdown parsing, and other core features.
 */

// Export model calculation function from openai-models
import { calculateCost as calcCost } from './OpenAIModels';

// Import AIModel from its actual source to avoid circular dependencies
import type { AIModel } from './models/api';

// Export error handling
export * from './errors/errors';

// Export OpenAI integration
export * from './OpenAIClient';
export * from './OpenAIModels';
export { type ModelPricing, type PricingConfig } from './OpenAIModels';
export * from './openai/prompts';

// Export tagging core
export * from './TaggingService';
export * from './ModelManager';

// Export from config selectively to avoid ambiguity
export {
  DEFAULT_CONFIG,
  configSchema,
  type Config,
  getDefaultConfigPath,
  loadConfig,
  saveConfig,
  updateConfig,
  getApiKey,
  setApiKey,
} from './config';

// Export from logger
export { type LogLevel, type LoggerConfig } from './Logger';

// Export markdown processing
export * from './markdown/FrontmatterProcessor';
export * from './markdown/DocumentProcessor';

// Export tagging functionality
export * from './tagging/TaxonomyManager';
export * from './tagging/BatchProcessingService';

// Export API validators selectively
export {
  aiModelSchema,
  apiKeyStorageSchema,
  taggingResultSchema,
  taggingOptionsSchema,
  documentSchema,
  rateLimitInfoSchema,
  apiErrorSchema,
  apiUsageStatsSchema,
  apiRequestTrackingSchema,
  apiConfigSchema,
  batchTaggingJobSchema,
  type AIModelSchema,
  type APIKeyStorageSchema,
  type TaggingResultSchema,
  type TaggingOptionsSchema,
  type DocumentSchema,
  type RateLimitInfoSchema,
  type APIErrorSchema,
  type APIUsageStatsSchema,
  type APIRequestTrackingSchema,
  type APIConfigSchema,
  type BatchTaggingJobSchema,
} from './validators/api-validators';

// Export tag validators selectively
export {
  yearTagSchema,
  lifeAreaTagSchema,
  domainTagSchema,
  subdomainTagSchema,
  contextualTagSchema,
  conversationTypeTagSchema,
  confidenceScoreSchema,
  topicalTagSchema,
  tagConfidenceSchema,
  tagSetSchema,
  tagBehaviorSchema,
  type YearTagSchema,
  type LifeAreaTagSchema,
  type DomainTagSchema,
  type SubdomainTagSchema,
  type ContextualTagSchema,
  type ConversationTypeTagSchema,
  type ConfidenceScoreSchema,
  type TopicalTagSchema,
  type TagConfidenceSchema,
  type TagSetSchema,
  type TagBehaviorSchema,
} from './validators/tags-validators';

// Export models
export * from './models/api';
export * from './models/tags';
export * from './models/taxonomy';
export * from './models/frontmatter-options';

// Export basic types
export * from './types/AsyncState';
export * from './types/DeepPartial';
export * from './types/PaginatedResult';
export * from './types/QueryOptions';
export * from './types/StringRecord';
export * from './types/TypedEventEmitter';

// Export utils
export * from './utils/FileUtils';
export * from './utils/string';
export * from './utils/DeepMerge';
export * from './markdown/MarkdownProcessor';
export { MarkdownProcessor } from './markdown/MarkdownProcessor';
export * from './utils/Chrono';
export * from './utils/validation';
export * from './utils/tag';
export * from './utils/prompt';

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
  const { OpenAIClient } = await import('./OpenAIClient');
  const { TaggingService } = await import('./TaggingService');
  const { TaxonomyManager } = await import('./tagging/TaxonomyManager');
  const { DocumentProcessor } = await import('./markdown/DocumentProcessor');
  const { BatchProcessingService } = await import('./tagging/BatchProcessingService');

  // Initialize OpenAI client
  const openAIClient = new OpenAIClient({
    apiKey: options.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? '',
    model: options.model ?? 'gpt-4o', // Use nullish coalescing
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
