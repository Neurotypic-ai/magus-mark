import type { AIModel } from '@obsidian-magic/core/models/api';
import type { TagBehavior } from '@obsidian-magic/core/models/tags';

import type { LogLevel } from './commands';

/**
 * Configuration interface
 */
export interface Config {
  // API settings
  apiKey?: string;
  defaultModel?: AIModel;

  // Processing settings
  concurrency?: number;
  tagMode?: TagBehavior;
  minConfidence?: number;
  reviewThreshold?: number;
  generateExplanations?: boolean;

  // Output settings
  outputFormat?: 'pretty' | 'json' | 'silent';
  logLevel?: LogLevel;
  vaultPath?: string;
  outputDir?: string;

  // Cost management
  costLimit?: number;
  onLimitReached?: 'pause' | 'warn' | 'stop';

  // Analytics
  enableAnalytics?: boolean;

  // Profiles
  profiles?: Record<string, Partial<Config>>;
  activeProfile?: string;
}

/**
 * Configuration storage interface
 */
export interface ConfigStorage {
  get<K extends keyof Config>(key: K): Config[K];
  set<K extends keyof Config>(key: K, value: Config[K]): Promise<void>;
  has(key: string): boolean;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll(): Config;
  save(): Promise<void>;
  reload(): Promise<void>;
}
