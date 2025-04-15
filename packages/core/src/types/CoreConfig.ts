/**
 * Shared configuration types for Obsidian Magic
 */

import type { AIModel } from '../models/AIModel';
import type { APIKeyStorage } from '../models/APIKeyStorage';
import type { TagBehavior } from '../models/TagBehavior';
import type { LogLevel } from '../utils/Logger';

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
