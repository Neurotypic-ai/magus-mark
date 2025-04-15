/**
 * Tagging services and types for the CLI
 * Re-exports tagging-related functionality from the core package
 */

// Export tagging services
export { TaggingService } from '@obsidian-magic/core/openai/TaggingService';
export { TaxonomyManager } from '@obsidian-magic/core/tagging/TaxonomyManager';
export { BatchProcessingService } from '@obsidian-magic/core/tagging/BatchProcessingService';

// Export tagging types
export type { Document } from '@obsidian-magic/core/tagging/types';
export type { TagBehavior, TagSet } from '@obsidian-magic/core/models/tags';
export type { Taxonomy, Category, Tag } from '@obsidian-magic/core/models/taxonomy';
export type { TaggingOptions } from '@obsidian-magic/core/openai/TaggingService';
