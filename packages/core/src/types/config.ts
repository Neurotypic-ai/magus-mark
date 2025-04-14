/**
 * Shared configuration types for Obsidian Magic
 */

import type { LogLevel } from '@obsidian-magic/logger';
import type { AIModel, APIKeyStorage, TagBehavior } from '@obsidian-magic/types';

/**
 * Output format options
 */
export type OutputFormat = 'pretty' | 'json' | 'silent';

/**
 * On limit reached behavior
 */
export type OnLimitReached = 'warn' | 'pause' | 'stop';

/**
 * Core configuration structure (shared across all apps)
 */
export interface CoreConfig {
  // API settings
  apiKey?: string;
  apiKeyStorage: APIKeyStorage;
  defaultModel?: AIModel;

  // Processing settings
  minConfidence: number;
  reviewThreshold: number;
  generateExplanations: boolean;
  concurrency: number;
  tagMode: TagBehavior;

  // Output settings
  outputFormat?: OutputFormat;
  logLevel: LogLevel;

  // Cost management
  costLimit?: number;
  onLimitReached?: OnLimitReached;
}
