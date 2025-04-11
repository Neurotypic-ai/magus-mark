import type { CommandModule } from 'yargs';
import { 
  loadConfig, 
  saveConfig, 
  updateConfig, 
  DEFAULT_CONFIG,
  fileExists,
  writeFile
} from '@obsidian-magic/utils';
import { logger } from '../utils/logger.js';

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
            type: 'string'
          }),
        handler: async (argv) => {
          const { key } = argv as any;
          const config = await loadConfig();
          
          if (key) {
            // Get a specific key
            const value = key.split('.').reduce((obj: Record<string, any>, k: string) => 
              obj && typeof obj === 'object' ? obj[k] : undefined, 
              config
            );
            
            if (value !== undefined) {
              logger.info(`${key}: ${JSON.stringify(value)}`);
            } else {
              logger.warn(`Configuration key '${key}' not found`);
            }
          } else {
            // Show all configuration values
            logger.box(JSON.stringify(config, null, 2), 'Current Configuration');
          }
        }
      })
      .command({
        command: 'set <key> <value>',
        describe: 'Set configuration values',
        builder: (yargs) => 
          yargs
            .positional('key', {
              describe: 'Configuration key to set',
              type: 'string',
              demandOption: true
            })
            .positional('value', {
              describe: 'Value to set',
              type: 'string',
              demandOption: true
            }),
        handler: async (argv) => {
          const { key, value } = argv as any;
          try {
            // Try to parse the value as JSON
            let parsedValue: any;
            try {
              parsedValue = JSON.parse(value as string);
            } catch (e) {
              // If it's not valid JSON, use the string value directly
              parsedValue = value;
            }
            
            // Create update object with nested path
            const updateObj: Record<string, any> = {};
            const keyParts = key.split('.');
            let current = updateObj;
            
            for (let i = 0; i < keyParts.length - 1; i++) {
              current[keyParts[i]] = {};
              current = current[keyParts[i]];
            }
            
            current[keyParts[keyParts.length - 1]] = parsedValue;
            await updateConfig(updateObj);
            
            logger.info(`Set ${key} = ${JSON.stringify(parsedValue)}`);
          } catch (error) {
            logger.error(`Failed to set configuration: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'import <file>',
        describe: 'Import configuration from file',
        builder: (yargs) => 
          yargs.positional('file', {
            describe: 'Path to configuration file',
            type: 'string',
            demandOption: true
          }),
        handler: async (argv) => {
          const { file } = argv as any;
          try {
            if (!(await fileExists(file as string))) {
              logger.error(`File not found: ${file}`);
              return;
            }
            
            const importedConfig = await loadConfig(file as string);
            await saveConfig(importedConfig);
            
            logger.info(`Configuration imported from ${file}`);
          } catch (error) {
            logger.error(`Failed to import configuration: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'export',
        describe: 'Export configuration to file',
        builder: (yargs) => 
          yargs
            .option('format', {
              describe: 'Output format',
              choices: ['json', 'yaml'],
              default: 'json'
            })
            .option('output', {
              describe: 'Output file path',
              type: 'string',
              default: './obsidian-magic-config.json',
              alias: 'o'
            }),
        handler: async (argv) => {
          const { format, output } = argv as any;
          try {
            const config = await loadConfig();
            const configStr = format === 'json' 
              ? JSON.stringify(config, null, 2)
              : '# TODO: Implement YAML export';
            
            await writeFile(output as string, configStr);
            logger.info(`Configuration exported to ${output}`);
          } catch (error) {
            logger.error(`Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })
      .command({
        command: 'reset',
        describe: 'Reset configuration to defaults',
        handler: async () => {
          await saveConfig(DEFAULT_CONFIG);
          logger.info('Configuration reset to defaults');
        }
      })
      .demandCommand(1, 'You must specify a command')
      .help();
  },
  handler: () => {} // Main handler doesn't do anything, subcommands are used instead
}; 