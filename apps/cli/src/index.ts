#!/usr/bin/env node
/**
 * Obsidian Magic CLI
 * A command-line tool for analyzing and tagging AI conversations
 */
import { AppError } from '@obsidian-magic/core';
import chalk from 'chalk';
import { config as dotenvConfig } from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { getAllCommands } from './commands/commands';
import { config } from './utils/config';
import { costManager } from './utils/cost-manager';
import { logger } from './utils/logger';

// Import update-notifier dynamically to avoid linter errors
let updateNotifier: any;
try {
  updateNotifier = require('update-notifier');
  updateNotifier({ pkg }).notify();
} catch (error) {
  logger.debug('Update notifier not available');
}

// Load environment variables from .env file
dotenvConfig();

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
    // Set up command line arguments
    const cli = yargs(hideBin(process.argv))
      .scriptName('obsidian-magic')
      .usage('$0 <command> [options]')
      .demandCommand(1, 'You must specify a command')
      .strict()
      .alias('h', 'help')
      .alias('v', 'version')
      .wrap(120)
      .fail((msg: string, err: Error) => {
        if (err) {
          // Handle custom errors
          if (err instanceof AppError) {
            logger.error(err.format());
            if (err.recoverable) {
              logger.info('Try running with --verbose for more details');
            }
          } else {
            logger.error(msg || err.message);
          }
        } else {
          logger.error(msg);
        }
        process.exit(1);
      });

    // Register all commands
    for (const command of getAllCommands()) {
      cli.command(command);
    }

    // Add global options
    cli.options({
      config: {
        describe: 'Path to configuration file',
        type: 'string',
      },
      verbose: {
        describe: 'Show detailed output',
        type: 'boolean',
        alias: 'V',
      },
      output: {
        describe: 'Output file path',
        type: 'string',
        alias: 'o',
      },
      'output-format': {
        describe: 'Output format',
        choices: ['pretty', 'json', 'silent'],
        default: config.get('outputFormat'),
      },
    });

    // Add version information
    cli.version(`v${pkg.version}`);

    // Add banner and help text
    const banner = chalk.bold.green(`Obsidian Magic CLI v${pkg.version}`);
    cli.epilogue(`For more information, see https://github.com/khallmark/obsidian-magic`);

    // Display banner before executing commands
    cli.middleware([
      (argv) => {
        if (!argv['help'] && !argv['version']) {
          console.log(banner);
          console.log();
        }
        return Promise.resolve();
      },
    ]);

    // Parse the arguments
    await cli.parse();

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
