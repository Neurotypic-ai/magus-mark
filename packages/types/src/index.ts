/**
 * Core type definitions for Obsidian Magic
 */

// Export all model types with specific imports to avoid conflicts
export * from './models/tags';
export * from './models/api';
export * from './models/taxonomy';
export * from './models/markdown-frontmatter';

// Re-export constants
export {
  DOMAINS,
  LIFE_AREAS,
  CONVERSATION_TYPES,
  CONTEXTUAL_TAGS_LIST,
  SUBDOMAINS_MAP,
  DEFAULT_TAXONOMY,
} from './models/taxonomy';

export type * from './models/tags';

// Utility types

// Re-export types for direct access
export type { Taxonomy } from './models/taxonomy';

export * from './types/AsyncState';
export * from './types/DeepPartial';
export * from './types/PaginatedResult';
export * from './types/QueryOptions';
export * from './types/StringRecord';
export * from './types/Result';
export * from './types/TypedEventEmitter';
