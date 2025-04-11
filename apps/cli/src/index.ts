#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { config as dotenvConfig } from 'dotenv';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

// Load environment variables from .env file
dotenvConfig();

// Import command modules
import { tagCommand } from './commands/tag.js';
import { testCommand } from './commands/test.js';
import { configCommand } from './commands/config.js';
import { configInteractiveCommand } from './commands/config-interactive.js';
import { statsCommand } from './commands/stats.js';
import { taxonomyCommand } from './commands/taxonomy.js';
import { logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';
import { costManager } from './utils/cost-manager.js';

// Get version from package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
let version = '0.1.0';

try {
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = fs.readJsonSync(packageJsonPath);
    version = packageJson.version;
  }
} catch (error) {
  // Fallback to hardcoded version if package.json can't be read
  logger.debug(`Could not read package.json: ${error instanceof Error ? error.message : String(error)}`);
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  if (error instanceof AppError) {
    logger.error(error.format());
  } else {
    logger.error(`Uncaught exception: ${error.message}`);
    logger.debug(error.stack || '');
  }
  
  // Save any usage data before exiting
  try {
    costManager.saveUsageData();
  } catch (e) {
    // Ignore errors during cleanup
  }
  
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason) => {
  if (reason instanceof AppError) {
    logger.error(reason.format());
  } else if (reason instanceof Error) {
    logger.error(`Unhandled rejection: ${reason.message}`);
    logger.debug(reason.stack || '');
  } else {
    logger.error(`Unhandled rejection: ${String(reason)}`);
  }
  
  // Save any usage data before exiting
  try {
    costManager.saveUsageData();
  } catch (e) {
    // Ignore errors during cleanup
  }
  
  process.exit(1);
});

/**
 * Main CLI application
 */
async function main() {
  try {
    await yargs(hideBin(process.argv))
      .scriptName('tag-conversations')
      .usage('$0 <command> [options]')
      .version(version)
      .middleware([(argv) => {
        // Configure logger based on global options
        const verbose = argv.verbose as boolean;
        const outputFormat = argv['output-format'] as 'pretty' | 'json' | 'silent' | undefined;
        
        logger.configure({
          logLevel: verbose ? 'debug' : 'info',
          outputFormat: outputFormat || 'pretty'
        });
        
        return argv;
      }])
      .option('config', {
        describe: 'Path to configuration file',
        type: 'string'
      })
      .option('verbose', {
        describe: 'Enable verbose output',
        alias: 'v',
        type: 'boolean',
        default: false
      })
      .option('output-format', {
        describe: 'Output format',
        choices: ['pretty', 'json', 'silent'],
        default: 'pretty'
      })
      .command(tagCommand)
      .command(testCommand)
      .command(configCommand)
      .command(configInteractiveCommand)
      .command(statsCommand)
      .command(taxonomyCommand)
      .demandCommand(1, 'You must specify a command')
      .strict()
      .help()
      .epilogue(
        `For more information, see the documentation at:\n  ${chalk.cyan(
          'https://github.com/yourusername/obsidian-magic'
        )}`
      )
      .wrap(null)
      .parse();
      
    // Save any usage data before exiting successfully
    costManager.saveUsageData();
  } catch (error) {
    if (error instanceof AppError) {
      logger.error(error.format());
    } else {
      logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        logger.debug(error.stack);
      }
    }
    
    // Save any usage data before exiting with error
    try {
      costManager.saveUsageData();
    } catch (e) {
      // Ignore errors during cleanup
    }
    
    process.exit(1);
  }
}

main();
