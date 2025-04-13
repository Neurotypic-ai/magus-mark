/**
 * Core type definitions for Obsidian Magic
 */

// Export all model types
export * from './models/tags';
export * from './models/api';
export * from './models/plugin';
export * from './models/cli';
export * from './models/vscode';
export * from './models/taxonomy';
export * from './models/markdown-frontmatter';

// Export config types with explicit naming to avoid conflicts
export type {
  CoreConfig,
  ObsidianPluginConfig,
  VSCodeConfig,
  LogLevel,
  OutputFormat,
  OnLimitReached,
  CLIConfig as ConfigCLI
} from './models/config';

// Re-export constants for direct access
export {
  DOMAINS,
  LIFE_AREAS,
  CONVERSATION_TYPES,
  CONTEXTUAL_TAGS_LIST,
  SUBDOMAINS_MAP,
  DEFAULT_TAXONOMY,
} from './models/taxonomy';

// Re-export types for direct access
export type { Taxonomy } from './models/taxonomy';

/**
 * Utility type for deep partial objects
 */
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

/**
 * Utility type for mapped record types
 */
export type StringRecord<T> = Record<string, T>;

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E };

/**
 * Async operation status
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async operation state
 */
export interface AsyncState<T, E = Error> {
  status: AsyncStatus;
  data?: T;
  error?: E;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems?: number;
  totalPages?: number;
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: Required<PaginationParams>;
}

/**
 * Sorting options
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter options
 */
export interface FilterOptions<T> {
  field: keyof T;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'startsWith' | 'endsWith';
  value: unknown;
}

/**
 * Query options
 */
export interface QueryOptions<T> {
  pagination?: PaginationParams;
  sort?: SortOptions;
  filters?: FilterOptions<T>[];
}

/**
 * Type-safe event emitter types
 */
export interface TypedEventEmitter<TEvents extends Record<string, unknown[]>> {
  on<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
  off<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
  once<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void;
}
