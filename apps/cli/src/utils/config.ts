/**
 * Configuration re-export from @obsidian-magic/utils
 * This file exists only to maintain backward compatibility and consistent imports
 */
import { 
  loadConfig, 
  saveConfig, 
  DEFAULT_CONFIG, 
  type Config 
} from '@obsidian-magic/utils';
import Conf from 'conf';
import { z } from 'zod';
import { cosmiconfig } from 'cosmiconfig';
import path from 'path';
import fs from 'fs-extra';
import type { AIModel, TagBehavior } from '@obsidian-magic/types';

/**
 * Legacy ConfigType alias for backward compatibility
 */
export type ConfigType = Config;

/**
 * Configuration manager class that provides a singleton interface to the config utilities
 * Provides backward compatibility with the previous implementation
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig: Config = DEFAULT_CONFIG;

  private constructor() {
    // Load configuration immediately
    this.loadConfig().catch(err => {
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
    saveConfig(this.currentConfig).catch(err => {
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
    saveConfig(this.currentConfig).catch(err => {
      console.error('Error saving configuration:', err);
    });
  }
}

export const config = ConfigManager.getInstance();

// Define the schema for configuration validation
const configSchema = z.object({
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

// Default configuration
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
  const explorer = cosmiconfig('tagconv');
  const result = explorer.searchSync() || { config: {} };
  return result.config;
}

// Create config instance
const configInstance = new Conf({
  projectName: 'obsidian-magic',
  schema: configSchema.partial(),
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