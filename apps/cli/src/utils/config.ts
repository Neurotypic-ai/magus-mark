/**
 * Configuration utilities for CLI
 */
import Conf from 'conf';
import { z } from 'zod';
import { cosmiconfig } from 'cosmiconfig';
import { readFile, writeFile, fileExists } from '@obsidian-magic/utils';
import type { AIModel, TagBehavior } from '@obsidian-magic/types';
import os from 'os';
import pathModule from 'path';

/**
 * Configuration type
 */
export type Config = {
  apiKey: string;
  defaultModel: AIModel;
  defaultTagBehavior: TagBehavior;
  minConfidence: number;
  reviewThreshold: number;
  concurrency: number;
  vaultPath?: string;
  outputPath?: string;
  costLimit: number;
  costLimitAction: 'warn' | 'pause' | 'stop';
  enableAnalytics: boolean;
  profiles?: Record<string, any>;
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'pretty' | 'json' | 'silent';
  };
};

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Config = {
  apiKey: '',
  defaultModel: 'gpt-3.5-turbo',
  defaultTagBehavior: 'merge',
  minConfidence: 0.7,
  reviewThreshold: 0.5,
  concurrency: 3,
  costLimit: 10,
  costLimitAction: 'warn',
  enableAnalytics: true,
  logging: {
    level: 'info',
    format: 'pretty'
  }
};

/**
 * Legacy ConfigType alias for backward compatibility
 */
export type ConfigType = Config;

/**
 * Get default config path
 */
function getDefaultConfigPath(): string {
  return pathModule.join(os.homedir(), '.config', 'obsidian-magic', 'config.json');
}

/**
 * Load configuration from file
 */
export async function loadConfig(configPath = getDefaultConfigPath()): Promise<Config> {
  try {
    if (await fileExists(configPath)) {
      const dataStr = await readFile(configPath);
      const data = JSON.parse(dataStr);
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
 * Configuration manager class that provides a singleton interface to the config utilities
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig: Config = DEFAULT_CONFIG;

  private constructor() {
    // Load configuration immediately
    this.loadConfig().catch((err: Error) => {
      console.error('Error loading configuration:', err);
    });
    
    // Handle environment variables
    if (process.env['OPENAI_API_KEY']) {
      this.currentConfig.apiKey = process.env['OPENAI_API_KEY'];
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration
   */
  private async loadConfig(path?: string): Promise<void> {
    this.currentConfig = await loadConfig(path);
  }

  /**
   * Get a configuration value
   */
  public get<K extends keyof Config>(key: K): Config[K] {
    return this.currentConfig[key];
  }

  /**
   * Set a configuration value
   */
  public set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.currentConfig[key] = value;
    saveConfig(this.currentConfig).catch((err: Error) => {
      console.error('Error saving configuration:', err);
    });
  }

  /**
   * Get all configuration values
   */
  public getAll(): Config {
    return this.currentConfig;
  }

  /**
   * Load configuration from a file
   */
  public async loadConfigFile(path: string): Promise<void> {
    await this.loadConfig(path);
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.currentConfig = DEFAULT_CONFIG;
    saveConfig(this.currentConfig).catch((err: Error) => {
      console.error('Error saving configuration:', err);
    });
  }
}

export const config = ConfigManager.getInstance();

// Define the schema for configuration validation
export const configSchema = z.object({
  // Core settings
  apiKey: z.string().optional(),
  defaultModel: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4o'] as const),
  defaultTagBehavior: z.enum(['append', 'replace', 'merge'] as const),
  
  // Processing parameters
  minConfidence: z.number().min(0).max(1),
  reviewThreshold: z.number().min(0).max(1),
  concurrency: z.number().int().min(1).max(10),
  
  // Paths
  vaultPath: z.string().optional(),
  outputPath: z.string().optional(),
  
  // Cost management
  costLimit: z.number().min(0),
  costLimitAction: z.enum(['warn', 'pause', 'stop'] as const),
  
  // Analytics
  enableAnalytics: z.boolean(),
  
  // Named profiles
  profiles: z.record(z.string(), z.any()).optional(),
  
  // Logging
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug'] as const),
    format: z.enum(['pretty', 'json', 'silent'] as const),
  })
});

// Default configuration for Conf
const defaultConfig = {
  defaultModel: 'gpt-3.5-turbo' as AIModel,
  defaultTagBehavior: 'merge' as TagBehavior,
  minConfidence: 0.7,
  reviewThreshold: 0.5,
  concurrency: 3,
  costLimit: 10,
  costLimitAction: 'warn' as const,
  enableAnalytics: true,
  logging: {
    level: 'info' as const,
    format: 'pretty' as const
  }
};

// Load environment-specific configuration (dev, prod, test)
function loadEnvironmentConfig() {
  try {
    // Use synchronous search to avoid async complexity during initialization
    const explorer = cosmiconfig('tagconv');
    // Try to use searchSync with type assertion
    const anyExplorer = explorer as any;
    if (typeof anyExplorer.searchSync === 'function') {
      const result = anyExplorer.searchSync();
      return result?.config || {};
    } else {
      // If searchSync is not available, just return defaults
      return {};
    }
  } catch (error) {
    console.warn(`Error loading environment config: ${(error as Error).message}`);
    return {};
  }
}

// Create config instance
const configInstance = new Conf({
  projectName: 'obsidian-magic',
  // Convert Zod schema to Conf schema format
  schema: {} as any,
  defaults: {
    ...defaultConfig,
    ...loadEnvironmentConfig()
  }
});

// Helper to get typed configuration values
const getConfigValue = <T>(key: string, defaultValue?: T): T => {
  return (configInstance.get(key) ?? defaultValue) as T;
};

// Helper to set configuration values
const setConfigValue = <T>(key: string, value: T): void => {
  configInstance.set(key, value);
};

// Export the typed configuration interface
export { configInstance, getConfigValue, setConfigValue }; 