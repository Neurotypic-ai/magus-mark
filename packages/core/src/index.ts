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

// Export OpenAI integration with explicit paths
export { OpenAIClient, type ModelPricing, type PricingConfig } from './openai/OpenAIClient';

// Export tagging core with explicit paths
export { TaggingService } from './openai/TaggingService';
export { ModelManager } from './openai/ModelManager';

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
export { type LogLevel, type LoggerConfig } from './Logger';

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
export {
  type YearTag,
  type LifeAreaTag,
  type DomainTag,
  type SubdomainTag,
  type ContextualTag,
  type ConversationTypeTag,
  type TopicalTag,
  type TagConfidence,
  type TagSet,
  type TagBehavior,
} from './models/tags';
export { type Taxonomy } from './models/taxonomy';

// Export basic types with explicit paths
export { type AsyncState } from './types/AsyncState';
export { type DeepPartial } from './types/DeepPartial';
export { type PaginatedResult } from './types/PaginatedResult';
export { type QueryOptions } from './types/QueryOptions';
export { type StringRecord } from './types/StringRecord';
export { type TypedEventEmitter } from './types/TypedEventEmitter';

// Export utilities with explicit paths
export { FileUtils } from './utils/FileUtils';
export {
  truncate,
  toKebabCase,
  toCamelCase,
  toPascalCase,
  slugify,
  normalizeLineEndings,
  escapeRegExp,
  sanitizeHtml,
  randomString,
  formatDuration,
  formatCurrency,
} from './utils/string';
export { deepMerge } from './utils/DeepMerge';
export { Chrono } from './utils/Chrono';
export {
  clamp,
  isDomainWithSubdomain,
  validateTagSet,
  getSubdomainsForDomain,
  isValidDomain,
  isValidLifeArea,
  isValidConversationType,
} from './utils/validation';
export {
  formatTag,
  createHierarchicalTag,
  extractDomain,
  extractSubdomain,
  formatTagSetForFrontmatter,
  createConfidence,
  mergeTagSets,
  getOverallConfidence,
  needsReview,
  getAllDomains,
  getAllSubdomains,
  getAllContextualTags,
} from './utils/tag';

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
