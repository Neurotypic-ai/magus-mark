import Conf from 'conf';
import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';

/**
 * Configuration schema with Zod validation
 */
const configSchema = z.object({
  apiKey: z.string().optional(),
  orgId: z.string().optional(),
  defaultModel: z.enum(['gpt-3.5-turbo', 'gpt-4']).default('gpt-3.5-turbo'),
  maxCost: z.number().min(0).default(5),
  concurrency: z.number().int().min(1).max(10).default(3),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  outputFormat: z.enum(['pretty', 'json', 'silent']).default('pretty'),
});

export type ConfigType = z.infer<typeof configSchema>;

/**
 * Default configuration values
 */
const defaultConfig: ConfigType = {
  defaultModel: 'gpt-3.5-turbo',
  maxCost: 5,
  concurrency: 3,
  logLevel: 'info',
  outputFormat: 'pretty',
};

/**
 * Configuration manager for Obsidian Magic CLI
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private conf: Conf<ConfigType>;
  private explorer = cosmiconfig('tag-conversations');

  private constructor() {
    this.conf = new Conf<ConfigType>({
      projectName: 'obsidian-magic',
      schema: defaultConfig as any,
      defaults: defaultConfig,
    });

    // Load environment variables
    if (process.env['OPENAI_API_KEY']) {
      this.set('apiKey', process.env['OPENAI_API_KEY']);
    }
    
    if (process.env['OPENAI_ORG_ID']) {
      this.set('orgId', process.env['OPENAI_ORG_ID']);
    }
    
    if (process.env['TAG_CONVERSATIONS_MAX_COST']) {
      const cost = parseFloat(process.env['TAG_CONVERSATIONS_MAX_COST']);
      if (!isNaN(cost)) {
        this.set('maxCost', cost);
      }
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
   * Get a configuration value
   */
  public get<K extends keyof ConfigType>(key: K): ConfigType[K] {
    return this.conf.get(key);
  }

  /**
   * Set a configuration value
   */
  public set<K extends keyof ConfigType>(key: K, value: ConfigType[K]): void {
    this.conf.set(key, value);
  }

  /**
   * Get all configuration values
   */
  public getAll(): ConfigType {
    return this.conf.store;
  }

  /**
   * Load configuration from a file
   */
  public async loadConfigFile(path?: string): Promise<void> {
    try {
      const result = path 
        ? await this.explorer.load(path)
        : await this.explorer.search();
      
      if (result && result.config) {
        // Validate the loaded config
        const validConfig = configSchema.partial().safeParse(result.config);
        if (validConfig.success) {
          Object.entries(validConfig.data).forEach(([key, value]) => {
            this.set(key as keyof ConfigType, value as any);
          });
        } else {
          console.warn('Invalid configuration:', validConfig.error.message);
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.conf.clear();
    this.conf.set(defaultConfig);
  }
}

export const config = ConfigManager.getInstance(); 