import os from 'node:os';
import path from 'node:path';

import { z } from 'zod';

import { fileExists, readJsonFile, writeJsonFile } from './utils/file';

import type { AIModel, APIKeyStorage } from './models/api';
import type { TagBehavior } from './models/tags';

/**
 * Logging level type
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  /**
   * Default AI model
   */
  defaultModel: 'gpt-4o' as AIModel,

  /**
   * Default tag behavior
   */
  defaultTagBehavior: 'merge' as TagBehavior,

  /**
   * Minimum confidence score to accept tags without review
   */
  minConfidence: 0.7,

  /**
   * Confidence score threshold for prompting user review
   */
  reviewThreshold: 0.5,

  /**
   * Whether to generate explanations for tags
   */
  generateExplanations: true,

  /**
   * API key storage location (local or system)
   */
  apiKeyStorage: 'local' as APIKeyStorage,

  /**
   * OpenAI API key (if stored locally)
   */
  apiKey: '',

  /**
   * Maximum number of concurrent API requests
   */
  concurrency: 3,

  /**
   * Cache configuration
   */
  cache: {
    /**
     * Whether to enable caching
     */
    enabled: true,

    /**
     * Cache directory path (defaults to user's cache directory)
     */
    directory: path.join(os.homedir(), '.cache', 'obsidian-magic'),
  },

  /**
   * Logging configuration
   */
  logging: {
    /**
     * Logging level (error, warn, info, debug)
     */
    level: 'info' as LogLevel,

    /**
     * Whether to log to console
     */
    console: true,

    /**
     * Whether to log to file
     */
    file: false,

    /**
     * Log file path
     */
    filePath: path.join(os.homedir(), '.logs', 'obsidian-magic.log'),
  },
};

/**
 * Configuration schema
 */
export const configSchema = z.object({
  defaultModel: z.string(),
  defaultTagBehavior: z.enum(['append', 'replace', 'merge', 'suggest']),
  minConfidence: z.number().min(0).max(1),
  reviewThreshold: z.number().min(0).max(1),
  generateExplanations: z.boolean(),
  apiKeyStorage: z.enum(['local', 'system']),
  apiKey: z.string(),
  concurrency: z.number().int().positive().max(10),
  cache: z.object({
    enabled: z.boolean(),
    directory: z.string(),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']),
    console: z.boolean(),
    file: z.boolean(),
    filePath: z.string(),
  }),
});

/**
 * Configuration type derived from schema
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Gets the default config file path
 * @returns Default config file path
 */
export function getDefaultConfigPath(): string {
  return path.join(os.homedir(), '.config', 'obsidian-magic', 'config.json');
}

/**
 * Loads configuration from file
 * @param configPath - Path to configuration file
 * @returns Loaded configuration
 */
export async function loadConfig(configPath = getDefaultConfigPath()): Promise<Config> {
  try {
    if (await fileExists(configPath)) {
      return await readJsonFile(configPath, configSchema);
    }

    // Config file doesn't exist, create with defaults
    const config = DEFAULT_CONFIG;
    await writeJsonFile(configPath, config);
    return config;
  } catch (error) {
    console.warn(`Error loading config from ${configPath}: ${(error as Error).message}`);
    console.warn('Using default configuration');
    return DEFAULT_CONFIG;
  }
}

/**
 * Saves configuration to file
 * @param config - Configuration to save
 * @param configPath - Path to configuration file
 */
export async function saveConfig(config: Config, configPath = getDefaultConfigPath()): Promise<void> {
  try {
    // Validate config before saving
    const validatedConfig = configSchema.parse(config);
    await writeJsonFile(configPath, validatedConfig);
  } catch (error) {
    throw new Error(`Failed to save config: ${(error as Error).message}`);
  }
}

/**
 * Updates specific configuration values
 * @param configUpdates - Partial configuration updates
 * @param configPath - Path to configuration file
 * @returns Updated configuration
 */
export async function updateConfig(
  configUpdates: Partial<Config>,
  configPath = getDefaultConfigPath()
): Promise<Config> {
  const currentConfig = await loadConfig(configPath);
  const updatedConfig = { ...currentConfig, ...configUpdates };

  // Recursively merge nested objects
  if (configUpdates.cache) {
    updatedConfig.cache = { ...currentConfig.cache, ...configUpdates.cache };
  }

  if (configUpdates.logging) {
    updatedConfig.logging = { ...currentConfig.logging, ...configUpdates.logging };
  }

  await saveConfig(updatedConfig, configPath);
  return updatedConfig;
}

/**
 * Gets the OpenAI API key from configuration or environment
 * @param config - Configuration object
 * @returns API key or null if not found
 */
export function getApiKey(config: Config): string | null {
  if (config.apiKeyStorage === 'local' && config.apiKey) {
    return config.apiKey;
  }

  // Try to get from environment
  const envApiKey = process.env['OPENAI_API_KEY'];
  if (envApiKey) {
    return envApiKey;
  }

  return null;
}

/**
 * Sets the OpenAI API key in configuration
 * @param apiKey - API key to set
 * @param config - Configuration object
 * @returns Updated configuration
 */
export async function setApiKey(apiKey: string, config: Config, configPath = getDefaultConfigPath()): Promise<Config> {
  const updatedConfig = {
    ...config,
    apiKey,
    apiKeyStorage: 'local' as const,
  };

  await saveConfig(updatedConfig, configPath);
  return updatedConfig;
}
