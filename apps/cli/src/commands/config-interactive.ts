import path from 'path';

import { confirm, input, number, select } from '@inquirer/prompts';
import chalk from 'chalk';
import * as fsExtra from 'fs-extra';

import { modelManager } from '@obsidian-magic/core';
import { logger } from '@obsidian-magic/logger';

import { config } from '../utils/config';

import type { ModelPricing } from '@obsidian-magic/core/src/openai-models';
import type { LogLevel } from '@obsidian-magic/logger';
import type { AIModel } from '@obsidian-magic/types';
import type { CommandModule } from 'yargs';

import type { Config } from '../types/config';

// Configuration types
export type TagMode = 'append' | 'replace' | 'merge' | 'suggest';
interface ConfigSettings {
  apiKey?: string | undefined;
  defaultModel: AIModel;
  tagMode: TagMode;
  concurrency?: number | undefined;
  logLevel: LogLevel;
  vaultPath?: string;
  enableAnalytics?: boolean;
  costLimit?: number | undefined;
  outputDir?: string;
  profiles?: Record<string, Partial<ConfigSettings>>;
  [key: string]: unknown;
}

/**
 * Get model choices for selection dropdown
 * @param apiKey API key to check available models
 * @returns Array of model choices
 */
async function getModelChoices(apiKey?: string): Promise<{ value: AIModel; name: string }[]> {
  if (!apiKey) {
    // Return empty choices if no API key is available
    return [];
  }

  try {
    // Get models from the API
    const models = await modelManager.getAvailableModels(apiKey);

    if (models.length === 0) {
      console.log(chalk.yellow('Warning: No models available for the provided API key.'));
      return [];
    }

    // Create a flat list of models
    return models.map((model: ModelPricing) => ({
      value: model.id,
      name: `${model.name} - ${getPriceDescription(model)}`,
    }));
  } catch (error) {
    console.error(chalk.red('Error fetching available models:'), error);
    return [];
  }
}

/**
 * Get price description for a model
 */
function getPriceDescription(model: ModelPricing): string {
  return `$${(model.inputPrice / 1000).toFixed(2)}/$${(model.outputPrice / 1000).toFixed(2)} per 1K tokens`;
}

/**
 * Interactive configuration setup
 */
export const configInteractiveCommand: CommandModule = {
  command: 'setup',
  describe: 'Interactive configuration setup',
  builder: (yargs) => {
    return yargs
      .option('profile', {
        describe: 'Configuration profile name',
        type: 'string',
      })
      .option('minimal', {
        describe: 'Only ask for essential settings',
        type: 'boolean',
        default: false,
      })
      .option('export', {
        describe: 'Export configuration to file after setup',
        type: 'string',
      });
  },
  handler: async (argv) => {
    try {
      const profileName = argv['profile'] as string | undefined;
      const minimal = argv['minimal'] as boolean;
      const exportPath = argv['export'] as string | undefined;

      const currentApiKey = process.env['OPENAI_API_KEY'] ?? config.get('apiKey');

      logger.info(chalk.bold('Interactive Configuration Setup'));

      if (minimal) {
        logger.info('Using minimal setup mode (essential settings only)');
      }

      // Define an object to hold our answers
      const answers: Partial<ConfigSettings> = {};

      // Essential settings
      const apiKeyResponse = await input({
        message: 'OpenAI API Key (press Enter to keep existing):',
        default: currentApiKey ? '[keep current]' : '',
        transformer: (inputValue) => {
          if (inputValue === '[keep current]' && currentApiKey) {
            return '****' + String(currentApiKey).slice(-4);
          }
          if (inputValue) {
            return '****' + inputValue.slice(-4);
          }
          return '';
        },
      });

      answers.apiKey = (apiKeyResponse === '[keep current]' ? currentApiKey : apiKeyResponse) ?? undefined;

      // Get model choices based on API key
      const modelChoices = await getModelChoices(answers.apiKey);

      // Select model with dynamic choices
      answers.defaultModel = await select<AIModel>({
        message: 'Default model for tagging (optional):',
        choices: [{ value: '' as AIModel, name: 'No default model' }, ...modelChoices],
        default: config.get('defaultModel') ?? '',
      });

      const currentTagMode = config.get('tagMode');
      answers.tagMode = await select<TagMode>({
        message: 'Default tag handling mode:',
        choices: [
          { value: 'append', name: 'append' },
          { value: 'replace', name: 'replace' },
          { value: 'merge', name: 'merge' },
        ],
        default: currentTagMode ?? 'merge',
      });

      // Advanced settings (only if not minimal)
      if (!minimal) {
        answers.concurrency = await number({
          message: 'Default concurrency level (1-10):',
          default: config.get('concurrency') ?? 3,
          validate: (value) => {
            if (value === undefined || value < 1 || value > 10) {
              return 'Please enter a value between 1 and 10';
            }
            return true;
          },
        });

        const currentLogLevel = config.get('logLevel');
        answers.logLevel = await select<LogLevel>({
          message: 'Log level:',
          choices: [
            { value: 'error', name: 'error' },
            { value: 'warn', name: 'warn' },
            { value: 'info', name: 'info' },
            { value: 'debug', name: 'debug' },
          ],
          default: currentLogLevel ?? 'info',
        });

        answers.vaultPath = await input({
          message: 'Path to Obsidian vault (optional):',
          default: config.get('vaultPath') ?? '',
          validate: async (inputValue) => {
            if (!inputValue) return true; // Optional

            // Safely check if path exists
            let exists = false;
            try {
              exists = await fsExtra.pathExists(inputValue);
            } catch {
              return 'Error checking path existence';
            }

            if (!exists) {
              return `Directory does not exist: ${inputValue}`;
            }

            return true;
          },
        });

        answers.enableAnalytics = await confirm({
          message: 'Enable anonymous usage analytics:',
          default: config.get('enableAnalytics') !== undefined ? Boolean(config.get('enableAnalytics')) : true,
        });

        answers.costLimit = await number({
          message: 'Monthly cost limit (USD):',
          default: config.get('costLimit') ?? 10,
          validate: (value) => {
            if (value === undefined || value < 0) {
              return 'Please enter a non-negative value';
            }
            return true;
          },
        });

        answers.outputDir = await input({
          message: 'Default output directory for reports:',
          default: config.get('outputDir') ?? './reports',
        });
      }

      // Confirm settings
      logger.info('\nReview your settings:');
      Object.entries(answers).forEach(([key, value]) => {
        // Handle stringification properly to avoid [object Object]
        let displayValue: string;

        if (value === undefined || value === null) {
          displayValue = '';
        } else if (key === 'apiKey' && typeof value === 'string') {
          displayValue = value ? '****' + value.slice(-4) : '';
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value);
        } else {
          displayValue = JSON.stringify(value);
        }

        logger.info(`${chalk.cyan(key)}: ${displayValue}`);
      });

      const confirmSettings = await confirm({
        message: 'Save these settings?',
        default: true,
      });

      if (!confirmSettings) {
        logger.info('Configuration cancelled.');
        return;
      }

      // Save the configuration
      for (const [key, value] of Object.entries(answers)) {
        if (value !== undefined && value !== null && value !== '') {
          // Using explicit type assertion to satisfy the linter
          void config.set(key as keyof Config, value as Config[keyof Config]);
        }
      }

      // If a profile was specified, save it as a named profile
      if (profileName) {
        const profiles = config.get('profiles') ?? {};
        profiles[profileName] = answers as Partial<Config>;
        void config.set('profiles', profiles);
        logger.success(`Profile '${profileName}' saved.`);
      }

      logger.success('Configuration updated successfully!');

      // Export configuration if requested
      if (exportPath) {
        try {
          const configData = config.getAll();
          const exportDir = path.dirname(exportPath);

          // Safely ensure directory exists
          try {
            await fsExtra.ensureDir(exportDir);
          } catch (error) {
            throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : String(error)}`);
          }

          // Safely write config file
          try {
            await fsExtra.writeJson(exportPath, configData, { spaces: 2 });
            logger.success(`Configuration exported to ${exportPath}`);
          } catch (error) {
            throw new Error(`Failed to write config file: ${error instanceof Error ? error.message : String(error)}`);
          }
        } catch (error) {
          logger.error(`Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Show next steps
      logger.box(
        `
Next Steps:

1. Run a test command:
   tag-conversations test --benchmark

2. Process your first file:
   tag-conversations tag ./path/to/conversation.md

3. View command help:
   tag-conversations <command> --help
      `.trim(),
        'Getting Started'
      );
    } catch (error) {
      logger.error(`Configuration setup failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  },
};
