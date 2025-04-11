import type { CommandModule } from 'yargs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

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
        type: 'string'
      })
      .option('minimal', {
        describe: 'Only ask for essential settings',
        type: 'boolean',
        default: false
      })
      .option('export', {
        describe: 'Export configuration to file after setup',
        type: 'string'
      });
  },
  handler: async (argv) => {
    try {
      const profileName = argv['profile'] as string | undefined;
      const minimal = argv['minimal'] as boolean;
      const exportPath = argv['export'] as string | undefined;
      
      const currentApiKey = process.env['OPENAI_API_KEY'] || config.get('apiKey');
      
      logger.info(chalk.bold('Interactive Configuration Setup'));
      
      if (minimal) {
        logger.info('Using minimal setup mode (essential settings only)');
      }
      
      // Define the configuration questions
      const essentialQuestions = [
        {
          type: 'input',
          name: 'apiKey',
          message: 'OpenAI API Key (press Enter to keep existing):',
          default: () => currentApiKey ? '[keep current]' : '',
          filter: (input: string) => {
            return input === '[keep current]' ? currentApiKey : input;
          }
        },
        {
          type: 'list',
          name: 'defaultModel',
          message: 'Default model for tagging:',
          choices: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o'],
          default: () => config.get('defaultModel') || 'gpt-3.5-turbo'
        },
        {
          type: 'list',
          name: 'tagMode',
          message: 'Default tag handling mode:',
          choices: ['append', 'replace', 'merge'],
          default: () => config.get('tagMode' as any) || 'merge'
        }
      ];
      
      const advancedQuestions = [
        {
          type: 'number',
          name: 'concurrency',
          message: 'Default concurrency level (1-10):',
          default: () => config.get('concurrency') || 3,
          validate: (input: number) => {
            if (input < 1 || input > 10) {
              return 'Please enter a value between 1 and 10';
            }
            return true;
          }
        },
        {
          type: 'list',
          name: 'logLevel',
          message: 'Log level:',
          choices: ['error', 'warn', 'info', 'debug'],
          default: () => config.get('logLevel' as any) || 'info'
        },
        {
          type: 'input',
          name: 'vaultPath',
          message: 'Path to Obsidian vault (optional):',
          default: () => config.get('vaultPath') || '',
          validate: async (input: string) => {
            if (!input) return true; // Optional
            if (!(await fs.pathExists(input))) {
              return `Directory does not exist: ${input}`;
            }
            return true;
          }
        },
        {
          type: 'confirm',
          name: 'enableAnalytics',
          message: 'Enable anonymous usage analytics:',
          default: () => config.get('enableAnalytics') !== undefined ? config.get('enableAnalytics') : true
        },
        {
          type: 'number',
          name: 'costLimit',
          message: 'Monthly cost limit (USD):',
          default: () => config.get('costLimit') || 10,
          validate: (input: number) => {
            if (input < 0) {
              return 'Please enter a non-negative value';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'outputDir',
          message: 'Default output directory for reports:',
          default: () => config.get('outputDir' as any) || './reports'
        }
      ];
      
      // Choose questions based on minimal flag
      const questions = minimal ? essentialQuestions : [...essentialQuestions, ...advancedQuestions];
      
      // Run the interactive prompt
      const answers = await inquirer.prompt(questions as any);
      
      // Confirm settings
      logger.info('\nReview your settings:');
      Object.entries(answers).forEach(([key, value]) => {
        const displayValue = key === 'apiKey' && value ? '****' + String(value).slice(-4) : value;
        logger.info(`${chalk.cyan(key)}: ${displayValue}`);
      });
      
      const { confirmSettings } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmSettings',
          message: 'Save these settings?',
          default: true
        }
      ]);
      
      if (!confirmSettings) {
        logger.info('Configuration cancelled.');
        return;
      }
      
      // Save the configuration
      Object.entries(answers).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          config.set(key as any, value);
        }
      });
      
      // If a profile was specified, save it as a named profile
      if (profileName) {
        const profiles = config.get('profiles') || {};
        profiles[profileName] = answers;
        config.set('profiles', profiles);
        logger.success(`Profile '${profileName}' saved.`);
      }
      
      logger.success('Configuration updated successfully!');
      
      // Export configuration if requested
      if (exportPath) {
        try {
          const configData = config.getAll();
          const exportDir = path.dirname(exportPath);
          
          // Ensure export directory exists
          await fs.ensureDir(exportDir);
          
          // Write config to file
          await fs.writeJson(exportPath, configData, { spaces: 2 });
          logger.success(`Configuration exported to ${exportPath}`);
        } catch (error) {
          logger.error(`Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Show next steps
      logger.box(`
Next Steps:

1. Run a test command:
   tag-conversations test --benchmark

2. Process your first file:
   tag-conversations tag ./path/to/conversation.md

3. View command help:
   tag-conversations <command> --help
      `.trim(), 'Getting Started');
      
    } catch (error) {
      logger.error(`Configuration setup failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}; 