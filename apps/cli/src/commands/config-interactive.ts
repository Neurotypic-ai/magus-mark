import type { CommandModule } from 'yargs';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import type { AIModel } from '@obsidian-magic/types';

/**
 * Interactive configuration setup
 */
export const configInteractiveCommand: CommandModule = {
  command: 'setup',
  describe: 'Interactive configuration setup',
  builder: (yargs) => {
    return yargs.option('profile', {
      describe: 'Configuration profile name',
      type: 'string'
    });
  },
  handler: async (argv) => {
    try {
      const profileName = argv.profile as string | undefined;
      
      const currentApiKey = process.env.OPENAI_API_KEY || config.get('apiKey');
      
      logger.info(chalk.bold('Interactive Configuration Setup'));
      
      // Define the configuration questions
      const questions = [
        {
          type: 'input',
          name: 'apiKey',
          message: 'OpenAI API Key (press Enter to keep existing):',
          default: () => '[keep current]',
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
          type: 'number',
          name: 'concurrency',
          message: 'Default concurrency level:',
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
          name: 'tagMode',
          message: 'Default tag handling mode:',
          choices: ['append', 'replace', 'merge'],
          default: () => config.get('tagMode') || 'merge'
        },
        {
          type: 'list',
          name: 'logLevel',
          message: 'Log level:',
          choices: ['error', 'warn', 'info', 'debug'],
          default: () => config.get('logLevel') || 'info'
        },
        {
          type: 'input',
          name: 'vaultPath',
          message: 'Path to Obsidian vault (optional):',
          default: () => config.get('vaultPath') || ''
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
          default: () => config.get('costLimit') || 10
        }
      ];
      
      // Run the interactive prompt
      const answers = await inquirer.prompt(questions);
      
      // Save the configuration
      Object.entries(answers).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          config.set(key, value);
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
      
      // Show a summary of the configuration
      let summary = '\nConfiguration Summary:\n';
      Object.entries(answers).forEach(([key, value]) => {
        const displayValue = key === 'apiKey' && value ? '****' + String(value).slice(-4) : value;
        summary += `${chalk.cyan(key)}: ${displayValue}\n`;
      });
      
      logger.box(summary);
      
    } catch (error) {
      logger.error(`Configuration setup failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}; 