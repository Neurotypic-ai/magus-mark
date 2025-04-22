import type { AIModel } from '@magus-mark/core/models/AIModel';
import type { TagBehavior } from '@magus-mark/core/models/TagBehavior';

import type { LogLevel } from './commands';

/**
 * Configuration interface
 */
export interface Config {
  // API settings
  apiKey?: string | undefined;
  defaultModel?: AIModel | undefined;

  // Processing settings
  concurrency?: number | undefined;
  tagMode?: TagBehavior | undefined;
  minConfidence?: number | undefined;
  reviewThreshold?: number | undefined;
  generateExplanations?: boolean | undefined;

  // Output settings
  outputFormat?: 'pretty' | 'json' | 'silent' | undefined;
  logLevel?: LogLevel | undefined;
  vaultPath?: string | undefined;
  outputDir?: string | undefined;

  // Cost management
  costLimit?: number | undefined;
  onLimitReached?: 'pause' | 'warn' | 'stop' | undefined;

  // Analytics
  enableAnalytics?: boolean | undefined;

  // Profiles
  profiles?: Record<string, Partial<Config>> | undefined;
  activeProfile?: string | undefined;
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
