/**
 * Configuration utilities for CLI
 */
import os from 'os';
import path from 'path';

import { fileExists, readFile, writeFile } from '@obsidian-magic/utils';
import Conf from 'conf';
import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs-extra';
import { z } from 'zod';

import { deepMerge } from '../mocks/utils';

import type { AIModel, TagBehavior } from '@obsidian-magic/types';

import type { LogLevel } from '../types/commands';
import type { Config, ConfigStorage } from '../types/config';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Config = {
  apiKey: undefined,
  defaultModel: 'gpt-3.5-turbo',
  tagMode: 'merge',
  minConfidence: 0.7,
  reviewThreshold: 0.5,
  concurrency: 3,
  outputFormat: 'pretty',
  logLevel: 'info',
  costLimit: 10,
  onLimitReached: 'warn',
  enableAnalytics: true,
  profiles: {},
  activeProfile: undefined,
  outputDir: undefined,
  vaultPath: undefined,
};

// Default configuration for Conf
const defaultConfig = {
  defaultModel: 'gpt-3.5-turbo' as AIModel,
  tagMode: 'merge' as TagBehavior,
  minConfidence: 0.7,
  reviewThreshold: 0.5,
  concurrency: 3,
  costLimit: 10,
  onLimitReached: 'warn' as const,
  enableAnalytics: true,
  outputFormat: 'pretty' as const,
  logLevel: 'info' as LogLevel,
};

/**
 * Legacy ConfigType alias for backward compatibility
 */
export type ConfigType = Config;

/**
 * Get default config path
 */
function getDefaultConfigPath(): string {
  return path.join(os.homedir(), '.config', 'obsidian-magic', 'config.json');
}

/**
 * Get configuration path
 */
function getConfigPath(): string {
  return getDefaultConfigPath();
}

/**
 * Load configuration from file
 */
export async function loadConfig(configPath = getDefaultConfigPath()): Promise<Config> {
  try {
    if (await fileExists(configPath)) {
      const dataStr = await readFile(configPath);
      const data = JSON.parse(dataStr) as Partial<Config>;
      return { ...DEFAULT_CONFIG, ...data };
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.warn(`Error loading config: ${(error as Error).message}`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: Config, configPath = getDefaultConfigPath()): Promise<void> {
  try {
    await writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${(error as Error).message}`);
  }
}

/**
 * Configuration storage implementation
 */
class ConfigImpl implements ConfigStorage {
  private static instance: ConfigImpl;
  private data: Config = { ...DEFAULT_CONFIG };
  private configPath: string;

  private constructor() {
    this.configPath = getConfigPath();
    this.reload().catch(console.error);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigImpl {
    if (!ConfigImpl.instance) {
      ConfigImpl.instance = new ConfigImpl();
    }
    return ConfigImpl.instance;
  }

  /**
   * Get a configuration value
   */
  public get<K extends keyof Config>(key: K): Config[K] {
    // Check environment variable first
    if (key === 'apiKey' && process.env['OPENAI_API_KEY']) {
      return process.env['OPENAI_API_KEY'] as unknown as Config[K];
    }

    // Check active profile
    if (this.data.activeProfile && this.data.profiles) {
      const profile = this.data.profiles[this.data.activeProfile];
      if (profile && key in profile) {
        return profile[key] as Config[K];
      }
    }

    // Return from config data or default
    return this.data[key] ?? (DEFAULT_CONFIG[key] as Config[K]);
  }

  /**
   * Set a configuration value
   */
  public set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.data[key] = value;
    this.save().catch(console.error);
  }

  /**
   * Check if a configuration key exists
   */
  public has(key: string): boolean {
    return key in this.data;
  }

  /**
   * Delete a configuration key
   */
  public delete(key: keyof Config): void {
    // Copy data, then delete to avoid dynamic delete
    const newData = { ...this.data };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete newData[key];
    this.data = newData;
    this.save().catch(console.error);
  }

  /**
   * Clear all configuration
   */
  public clear(): void {
    this.data = { ...DEFAULT_CONFIG };
    this.save().catch(console.error);
  }

  /**
   * Get all configuration
   */
  public getAll(): Config {
    return { ...this.data };
  }

  /**
   * Save configuration to file
   */
  public async save(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, this.data, { spaces: 2 });
    } catch (error) {
      console.error(`Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reload configuration from file
   */
  public async reload(): Promise<void> {
    try {
      const fileExists = await fs.pathExists(this.configPath);
      if (fileExists) {
        const fileData = (await fs.readJson(this.configPath)) as Partial<Config>;
        this.data = deepMerge(DEFAULT_CONFIG, fileData);
      } else {
        this.data = { ...DEFAULT_CONFIG };
        await this.save();
      }
    } catch (error) {
      console.error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
      this.data = { ...DEFAULT_CONFIG };
    }
  }
}

// Export singleton instance
export const config = ConfigImpl.getInstance();

// Define the schema for configuration validation
export const configSchema = z.object({
  // Core settings
  apiKey: z.string().optional(),
  defaultModel: z
    .enum([
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-4-vision',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-instruct',
      'davinci-002',
      'babbage-002',
    ])
    .optional(),

  // Processing parameters
  minConfidence: z.number().min(0).max(1).optional(),
  reviewThreshold: z.number().min(0).max(1).optional(),
  concurrency: z.number().int().min(1).max(10).optional(),

  // Paths
  vaultPath: z.string().optional(),
  outputDir: z.string().optional(),

  // Cost management
  costLimit: z.number().min(0).optional(),
  onLimitReached: z.enum(['warn', 'pause', 'stop'] as const).optional(),

  // Analytics
  enableAnalytics: z.boolean().optional(),

  // Named profiles
  profiles: z.record(z.string(), z.any()).optional(),

  // Output settings
  outputFormat: z.enum(['pretty', 'json', 'silent'] as const).optional(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug'] as const).optional(),

  // Additional settings
  tagMode: z.enum(['append', 'replace', 'merge'] as const).optional(),
  activeProfile: z.string().optional(),
});

// Load environment-specific configuration (dev, prod, test)
function loadEnvironmentConfig(): Record<string, unknown> {
  try {
    // Use synchronous search to avoid async complexity during initialization
    const explorer = cosmiconfig('tagconv');

    // Try to load configuration safely
    try {
      // Use dynamic import or reflection if needed
      // This is a safe approach using any because we properly handle errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchMethod = (explorer as any).searchSync;
      if (typeof searchMethod === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const result = searchMethod();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (result && typeof result === 'object' && result.config) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return result.config;
        }
      }
    } catch {
      // If searchSync is not available, return empty object
      console.warn('searchSync method not available, using empty config');
    }

    return {};
  } catch (error) {
    console.warn(`Error loading environment config: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

// Create config instance with defined schema
const configInstance = new Conf({
  projectName: 'obsidian-magic',
  // Provide a placeholder schema that will be compatible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: undefined as any,
  defaults: {
    ...defaultConfig,
    ...loadEnvironmentConfig(),
  },
});

// Helper to get typed configuration values
const getConfigValue = (key: string): unknown => {
  return configInstance.get(key);
};

// Helper to set configuration values
const setConfigValue = (key: string, value: unknown): void => {
  configInstance.set(key, value);
};

// Export the typed configuration interface
export { configInstance, getConfigValue, setConfigValue };
