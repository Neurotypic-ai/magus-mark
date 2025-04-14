#!/usr/bin/env node
/**
 * Obsidian Magic CLI
 * A command-line tool for analyzing and tagging AI conversations
 */
import { AppError } from '@obsidian-magic/core';
import { logger } from '@obsidian-magic/logger';
import chalk from 'chalk';
import { config as dotenvConfig } from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pkg from '../package.json';
import { getAllCommands } from './commands/commands';
import { config } from './utils/config';
import { costManager } from './utils/cost-manager';

// Import update-notifier dynamically to avoid linter errors
type UpdateNotifier = (options: { pkg: { name: string; version: string } }) => { notify(): void };

// Check for updates asynchronously
(async () => {
  try {
    // Import dynamically using ES module syntax
    const updateNotifierModule = await import('update-notifier');
    const updateNotifier = updateNotifierModule.default as UpdateNotifier;
    updateNotifier({ pkg }).notify();
  } catch {
    logger.debug('Update notifier not available');
  }
})().catch(() => {
  // Ignore any errors from the update check
});

// Initialize the CLI tool
dotenvConfig();

// Set log level from environment variable or config
const logLevel = process.env['LOG_LEVEL'] ?? config.get('logLevel') ?? 'info';
const outputFormat = process.env['OUTPUT_FORMAT'] ?? config.get('outputFormat') ?? 'pretty';

// Configure logger
logger.configure({
  logLevel: logLevel as 'error' | 'warn' | 'info' | 'debug',
  outputFormat: outputFormat as 'pretty' | 'json' | 'silent'
});

/**
 * Banner function
 */
function showBanner() {
  if (outputFormat !== 'silent') {
    logger.box(
      `Obsidian Magic v${pkg.version}\n` +
      `Current cost limit: ${logger.formatCost(costManager.getCostLimit())}`,
      'CLI Tool'
    );
  }
}

// Display banner and welcome message
showBanner();

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
        // Handle custom errors
        if (err instanceof AppError) {
          logger.error(err.format());
          if (err.recoverable) {
            logger.info('Try running with --verbose for more details');
          }
        } else {
          logger.error(msg || err.message);
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
  } catch (error) {
    // Handle uncaught errors
    if (error instanceof AppError) {
      logger.error(error.format());
    } else if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`);
      if (logLevel === 'debug') {
        console.error(error);
      }
    } else {
      logger.error(`Unknown error: ${String(error)}`);
    }
    process.exit(1);
  }
}

// Run the application
main().catch((err: unknown) => {
  // This should never happen as main() already catches errors
  console.error('Critical error:', err);
  process.exit(1);
});
