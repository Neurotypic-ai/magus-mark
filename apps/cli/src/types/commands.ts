import type { AIModel, TagBehavior } from '@obsidian-magic/core';

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Common command options interface
 */
export interface CommonOptions {
  config?: string;
  verbose?: boolean;
  output?: string;
  outputFormat?: 'pretty' | 'json' | 'silent';
}

/**
 * Tag command options interface
 */
export interface TagOptions extends CommonOptions {
  model?: AIModel;
  mode?: 'auto' | 'interactive' | 'differential';
  dryRun?: boolean;
  force?: boolean;
  concurrency?: number;
  tagMode?: TagBehavior;
  minConfidence?: number;
  reviewThreshold?: number;
  maxCost?: number;
  onLimit?: 'pause' | 'warn' | 'stop';
}

/**
 * Test command options interface
 */
export interface TestOptions extends CommonOptions {
  samples?: number;
  testSet?: string;
  models?: AIModel[];
  benchmark?: boolean;
  report?: string;
}

/**
 * Config command options interface
 */
export interface ConfigOptions extends CommonOptions {
  key?: string;
  value?: string;
  file?: string;
  format?: 'json' | 'yaml';
}

/**
 * Stats command options interface
 */
export interface StatsOptions extends CommonOptions {
  period?: 'day' | 'week' | 'month' | 'all';
  type?: 'usage' | 'cost' | 'all';
}

/**
 * Taxonomy command options interface
 */
export interface TaxonomyOptions extends CommonOptions {
  domain?: string;
  description?: string;
  file?: string;
}

/**
 * Type alias for all command options
 */
export type CommandOptions = TagOptions | TestOptions | ConfigOptions | StatsOptions | TaxonomyOptions;
