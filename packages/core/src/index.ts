/**
 * Core functionality for Obsidian Magic
 *
 * This module contains shared business logic for the tagging system,
 * OpenAI integration, markdown parsing, and other core features.
 */

// Explicit imports with full paths to avoid barrel files
import { OpenAIClient } from './OpenAIClient';
import { TaggingService } from './TaggingService';
import { DocumentProcessor } from './markdown/DocumentProcessor';
import { BatchProcessingService } from './tagging/BatchProcessingService';
import { TaxonomyManager } from './tagging/TaxonomyManager';

import type { AIModel } from './models/api';

// Export from explicit paths
export {
  AppError,
  ValidationError,
  FileSystemError,
  NetworkError,
  APIError,
  ApiKeyError,
  ConfigurationError,
  MarkdownError,
  TaggingError,
  CostLimitError,
  Result,
  type ResultObject,
  success,
  failure,
  tryCatch,
  tryOrNull,
  toAppError,
  normalizeError,
  withRetry,
  type ErrorCode,
} from './errors/errors';

// Export OpenAI integration with explicit paths
export { OpenAIClient, type ModelPricing, type PricingConfig } from './OpenAIClient';

// Export tagging core with explicit paths
export { TaggingService } from './TaggingService';
export { ModelManager } from './ModelManager';

// Export configuration with explicit paths
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

// Export logger with explicit paths
export { Logger, type LogLevel, type LoggerConfig } from './Logger';

// Export markdown processing with explicit paths
export { FrontmatterProcessor } from './markdown/FrontmatterProcessor';
export { DocumentProcessor } from './markdown/DocumentProcessor';
export { MarkdownProcessor } from './markdown/MarkdownProcessor';

// Export tagging functionality with explicit paths
export { TaxonomyManager } from './tagging/TaxonomyManager';
export { BatchProcessingService } from './tagging/BatchProcessingService';

// Export validators with explicit paths
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

// Export tag validators with explicit paths
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

// Export models with explicit paths
export { type AIModel } from './models/api';
export { type TagConfidence } from './models/tags';
export { type Taxonomy } from './models/taxonomy';
export { type FrontmatterOptions } from './markdown/frontmatter-options';

// Export basic types with explicit paths
export { type AsyncState } from './types/AsyncState';
export { type DeepPartial } from './types/DeepPartial';
export { type PaginatedResult } from './types/PaginatedResult';
export { type QueryOptions } from './types/QueryOptions';
export { type StringRecord } from './types/StringRecord';
export { type TypedEventEmitter } from './types/TypedEventEmitter';

export { deepMerge } from './utils/DeepMerge';

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
