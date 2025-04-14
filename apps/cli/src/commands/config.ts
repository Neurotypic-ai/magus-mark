import { confirm } from '@inquirer/prompts';
import { modelManager } from '@obsidian-magic/core/src/model-manager';
import { fileExists, writeFile } from '@obsidian-magic/utils';

import { config } from '../utils/config';
import { logger } from '@obsidian-magic/logger';

import type { CommandModule } from 'yargs';

export const configCommand: CommandModule = {
  command: 'config <command>',
  describe: 'Manage configuration options',
  builder: (yargs) => {
    return yargs
      .command({
        command: 'get [key]',
        describe: 'View configuration values',
        builder: (yargs) =>
          yargs.positional('key', {
            describe: 'Configuration key to get',
            type: 'string',
          }),
        handler: (argv) => {
          const { key } = argv as { key?: string };
          const currentConfig = config.getAll();

          if (key) {
            // Get a specific key
            const value = key.split('.').reduce<unknown>((obj, k) => {
              if (obj && typeof obj === 'object') {
                return (obj as Record<string, unknown>)[k];
              }
              return undefined;
            }, currentConfig);

            if (value !== undefined) {
              logger.info(`${String(key)}: ${JSON.stringify(value)}`);
            } else {
              logger.warn(`Configuration key '${String(key)}' not found`);
            }
          } else {
            // Show all configuration values
            logger.box(JSON.stringify(currentConfig, null, 2), 'Current Configuration');
          }
        },
      })
      .command({
        command: 'set <key> <value>',
        describe: 'Set configuration values',
        builder: (yargs) =>
          yargs
            .positional('key', {
              describe: 'Configuration key to set',
              type: 'string',
              demandOption: true,
            })
            .positional('value', {
              describe: 'Value to set',
              type: 'string',
              demandOption: true,
            })
            .option('validate', {
              describe: 'Validate the value before setting (for models)',
              type: 'boolean',
              default: true,
            }),
        handler: async (argv) => {
          const { key, value, validate } = argv as { key: string; value: string; validate: boolean };
          try {
            // Try to parse the value as JSON
            let parsedValue: unknown;
            try {
              parsedValue = JSON.parse(value);
            } catch {
              // If it's not valid JSON, use the string value directly
              parsedValue = value;
            }

            // Special handling for model setting
            if (key === 'defaultModel' && typeof parsedValue === 'string' && validate) {
              const apiKey = config.get('apiKey');

              if (apiKey) {
                logger.info(`Validating model '${String(parsedValue)}'...`);
                const validation = await modelManager.validateModel(parsedValue, apiKey, {
                  verifyWithApi: true,
                  throwOnInvalid: false,
                  useFallback: false,
                });

                if (!validation.valid) {
                  logger.warn(
                    `Model '${String(parsedValue)}' may not be available: ${validation.errorMessage ?? 'Unknown error'}`
                  );
                  // Use @inquirer/prompts confirm
                  const proceed = await confirm({
                    message: 'Set this model anyway?',
                    default: false,
                  });

                  if (!proceed) {
                    logger.info('Operation cancelled.');
                    return;
                  }
                } else {
                  logger.success(`Model '${String(parsedValue)}' is valid and available.`);
                }
              } else {
                logger.warn('No API key set, skipping model validation.');
              }
            }

            // Set the value
            await config.set(key as keyof typeof config.getAll, parsedValue as never);

            logger.info(`Set ${String(key)} = ${JSON.stringify(parsedValue)}`);
          } catch (error) {
            logger.error(`Failed to set configuration: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'import <file>',
        describe: 'Import configuration from file',
        builder: (yargs) =>
          yargs.positional('file', {
            describe: 'Path to configuration file',
            type: 'string',
            demandOption: true,
          }),
        handler: async (argv) => {
          const { file } = argv as { file: string };
          try {
            if (!(await fileExists(file))) {
              logger.error(`File not found: ${String(file)}`);
              return;
            }

            await config.reload();

            logger.info(`Configuration imported from ${String(file)}`);
          } catch (error) {
            logger.error(`Failed to import configuration: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'export',
        describe: 'Export configuration to file',
        builder: (yargs) =>
          yargs
            .option('format', {
              describe: 'Output format',
              choices: ['json', 'yaml'],
              default: 'json',
            })
            .option('output', {
              describe: 'Output file path',
              type: 'string',
              default: './obsidian-magic-config.json',
              alias: 'o',
            }),
        handler: async (argv) => {
          const { format, output } = argv as { format: string; output: string };
          try {
            const currentConfig = config.getAll();
            const configStr =
              format === 'json' ? JSON.stringify(currentConfig, null, 2) : '# TODO: Implement YAML export';

            await writeFile(output, configStr);
            logger.info(`Configuration exported to ${String(output)}`);
          } catch (error) {
            logger.error(`Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`);
          }
        },
      })
      .command({
        command: 'reset',
        describe: 'Reset configuration to defaults',
        handler: async () => {
          await config.clear();
          logger.info('Configuration reset to defaults');
        },
      })
      .command({
        command: 'validate-model [model]',
        describe: 'Validate if a model is available',
        builder: (yargs) =>
          yargs.positional('model', {
            describe: 'Model ID to validate (uses defaultModel if not specified)',
            type: 'string',
          }),
        handler: async (argv) => {
          const { model } = argv as { model?: string };
          const modelId = model ?? config.get('defaultModel');
          const apiKey = config.get('apiKey');

          if (!apiKey) {
            logger.error('No API key configured. Please set an API key first.');
            return;
          }

          if (!modelId) {
            logger.error('No model specified and no default model configured.');
            return;
          }

          logger.info(`Validating model: ${String(modelId)}`);

          try {
            const validation = await modelManager.validateModel(modelId, apiKey, {
              verifyWithApi: true,
              throwOnInvalid: false,
              useFallback: true,
            });

            if (validation.valid) {
              if (validation.usedFallback) {
                logger.warn(`Model '${String(modelId)}' is not available. Using fallback: ${validation.modelId}`);
              } else {
                logger.success(`Model '${String(modelId)}' is valid and available.`);
              }
            } else {
              logger.error(`Model validation failed: ${validation.errorMessage ?? 'Unknown error'}`);
            }
          } catch (error) {
            if (error instanceof Error) {
              logger.error(`Error validating model: ${error.message}`);
            } else {
              logger.error(`Error validating model: ${String(error)}`);
            }
          }
        },
      })
      .demandCommand(1, 'You must specify a command')
      .help();
  },
  handler: (): void => {
    // Main handler doesn't do anything, subcommands are used instead
  },
};
