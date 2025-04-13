/**
 * Shared configuration types for Obsidian Magic
 */

import type { AIModel, APIKeyStorage } from './api';
import type { TagBehavior } from './tags';

/**
 * Logging level type
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

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

/**
 * CLI-specific configuration
 */
export interface CLIConfig extends CoreConfig {
  // CLI-specific paths
  vaultPath?: string;
  outputDir?: string;

  // Analytics
  enableAnalytics: boolean;

  // Profile management
  profiles?: Record<string, Partial<CLIConfig>>;
  activeProfile?: string;
}

/**
 * Obsidian plugin configuration
 */
export interface ObsidianPluginConfig extends CoreConfig {
  // Obsidian-specific settings
  autoScanOnStartup?: boolean;
  highlightTags?: boolean;
}

/**
 * VS Code extension configuration
 */
export interface VSCodeConfig extends CoreConfig {
  // VS Code-specific settings
  syncWithObsidianVault?: boolean;
  autoTriggerCompletion?: boolean;
}
