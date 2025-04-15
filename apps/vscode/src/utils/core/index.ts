/**
 * Core utilities for VS Code extension
 * Re-exports core functionality with proper imports
 */

// Re-export the initializeCore function
export { initializeCore, VERSION } from '@obsidian-magic/core';

// Re-export tagging types and services
export { TaggingService } from '@obsidian-magic/core/openai/TaggingService';
export { TaxonomyManager } from '@obsidian-magic/core/tagging/TaxonomyManager';

// Export tag types
export type { APIConfig, TagSet, TaggingOptions } from '@obsidian-magic/core/models/tags';
export type { Category, Tag, Taxonomy } from '@obsidian-magic/core/models/taxonomy';
