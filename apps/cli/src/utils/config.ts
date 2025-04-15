/**
 * Configuration utilities for CLI
 */
import os from 'os';
import path from 'path';

import Conf from 'conf';
import { cosmiconfig } from 'cosmiconfig';
import fs from 'fs-extra';
import { z } from 'zod';

// Import deepMerge utility
import { deepMerge } from '@obsidian-magic/core/utils/Object';

import type { LogLevel } from '@obsidian-magic/core/Logger';
import type { TagBehavior } from '@obsidian-magic/core/models/tags';
import type { OnLimitReached, OutputFormat } from '@obsidian-magic/core/types/CoreConfig';

import type { Config, ConfigStorage } from '../types/config';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Config = {
  apiKey: '',
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
  generateExplanations: true,
};

// Default configuration for Conf
const defaultConfig = {
  tagMode: 'merge' as TagBehavior,
  minConfidence: 0.7,
  reviewThreshold: 0.5,
  concurrency: 3,
  costLimit: 10,
  onLimitReached: 'warn' as OnLimitReached,
  enableAnalytics: true,
  outputFormat: 'pretty' as OutputFormat,
  logLevel: 'info' as LogLevel,
  generateExplanations: true,
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
    const fileExists = await fs.pathExists(configPath);
    if (fileExists) {
      const dataStr = await fs.readFile(configPath, 'utf-8');
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
    await fs.ensureDir(path.dirname(configPath));
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save config: ${(error as Error).message}`);
  }
}

/**
 * Configuration storage implementation
 */
class ConfigImpl implements ConfigStorage {
  private static instance: ConfigImpl | undefined;
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
    ConfigImpl.instance ??= new ConfigImpl();
    return ConfigImpl.instance;
  }

  /**
   * Get a configuration value
   */
  public get<K extends keyof Config>(key: K): Config[K] {
    // Check environment variable first
    if (key === 'apiKey' && process.env['OPENAI_API_KEY']) {
      return process.env['OPENAI_API_KEY'] as Config[K];
    }

    // Check active profile
    if (this.data.activeProfile && this.data.profiles) {
      const profile = this.data.profiles[this.data.activeProfile];
      if (profile && key in profile) {
        const value = profile[key];
        return value as Config[K];
      }
    }

    // Special case for defaultModel - don't provide a default value
    if (key === 'defaultModel') {
      const value = this.data[key];
      return value as Config[K];
    }

    // Return from config data or default
    const value = this.data[key] ?? DEFAULT_CONFIG[key];
    return value as Config[K];
  }

  /**
   * Set a configuration value and save it
   */
  public async set<K extends keyof Config>(key: K, value: Config[K]): Promise<void> {
    // Check if we're changing the API key
    if (key === 'apiKey' && this.data[key] !== value) {
      // In a real implementation, we might want to clear caches or refresh tokens
      // But for now, we'll just log that the API key has changed
      console.log('API key has been updated.');
    }

    // If we're changing the active profile, make sure it exists
    if (key === 'activeProfile' && typeof value === 'string') {
      if (!this.data.profiles || !(value in this.data.profiles)) {
        this.data.profiles ??= {};
        this.data.profiles[value] = {};
      }
    }

    if (this.data.activeProfile && this.data.profiles) {
      // Store in active profile
      this.data.profiles[this.data.activeProfile] = {
        ...this.data.profiles[this.data.activeProfile],
        [key]: value,
      };
    } else {
      // Store in main config
      this.data[key] = value;
    }

    await this.save();
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
  public async delete(key: keyof Config): Promise<void> {
    // Copy data, then delete to avoid dynamic delete
    const newData = { ...this.data };
    delete newData[key];
    this.data = newData;
    await this.save();
  }

  /**
   * Clear all configuration
   */
  public async clear(): Promise<void> {
    this.data = { ...DEFAULT_CONFIG };
    await this.save();
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
        // Cast both objects to satisfy deepMerge's type constraints
        this.data = deepMerge(DEFAULT_CONFIG as Record<string, unknown>, fileData as Record<string, unknown>) as Config;
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
  defaultModel: z.string().optional(),

  // Processing parameters
  minConfidence: z.number().min(0).max(1).optional(),
  reviewThreshold: z.number().min(0).max(1).optional(),
  concurrency: z.number().int().min(1).max(10).optional(),
  generateExplanations: z.boolean().optional(),

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
      // Use a more specific type for the explorer object
      const explorerWithSearch = explorer as {
        searchSync?: () => { config?: Record<string, unknown> } | null;
      };

      const searchMethod = explorerWithSearch.searchSync;
      if (searchMethod) {
        const result = searchMethod();
        if (result?.config) {
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
  schema: undefined as any, // Required due to Conf's Schema type complexity
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
