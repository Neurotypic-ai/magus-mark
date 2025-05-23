#!/usr/bin/env node
/**
 * Magus Mark CLI
 * A command-line tool for analyzing and tagging AI conversations
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { Logger } from '@magus-mark/core/utils/Logger';

import { configCommand } from './commands/config';
import { configInteractiveCommand } from './commands/config-interactive';
import { statsCommand } from './commands/stats';
import { tagCommand } from './commands/tag';
import { taxonomyCommand } from './commands/taxonomy';
import { testCommand } from './commands/test';

import type { ArgumentsCamelCase, Argv } from 'yargs';

const logger = Logger.getInstance('cli');

// Function to get package version
function getPackageVersion(): string {
  try {
    const packageJsonPath = new URL('../package.json', import.meta.url);
    const packageJson = JSON.parse(readFileSync(fileURLToPath(packageJsonPath), 'utf8')) as { version: string };
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

const packageVersion = getPackageVersion();

// Create Yargs instance
const cli = yargs(hideBin(process.argv))
  .scriptName('magus-mark')
  .version(packageVersion)
  .strict()
  .demandCommand(1, 'You must provide a command')
  .help()
  .showHelpOnFail(true)
  .wrap(120)
  .epilogue('For more information, visit: https://github.com/your-org/magus-mark')
  .middleware((argv: ArgumentsCamelCase<Record<string, unknown>>) => {
    // Global middleware for all commands
    const verbose = argv['verbose'] as boolean | undefined;
    if (verbose) {
      logger.configure({ logLevel: 'debug', outputFormat: 'pretty' });
    }

    // Log startup info
    logger.debug(`CLI v${packageVersion} starting...`);
  })
  .command(tagCommand)
  .command(configCommand)
  .command(configInteractiveCommand)
  .command(statsCommand)
  .command(taxonomyCommand)
  .command(testCommand)
  .option('verbose', {
    describe: 'Show detailed output',
    type: 'boolean',
    alias: 'v',
    global: true,
  })
  .option('config', {
    describe: 'Path to configuration file',
    type: 'string',
    global: true,
  })
  .option('output-format', {
    describe: 'Output format',
    choices: ['pretty', 'json', 'silent'] as const,
    default: 'pretty' as const,
    global: true,
  })
  .example('$0 tag ./conversations/', 'Process all markdown files in the conversations directory')
  .example('$0 config set apiKey your-key-here', 'Set your OpenAI API key')
  .example('$0 setup', 'Run interactive configuration setup')
  .example('$0 stats --period=week', 'Show usage statistics for the past week')
  .fail((msg, err, yargsInstance: Argv) => {
    if (err) {
      logger.error(`Error: ${err.message}`);
    } else if (msg) {
      logger.error(`Error: ${msg}`);
    }

    logger.info(chalk.gray('Run with --help to see available commands and options.'));

    // Show help if the command is not recognized
    if (msg && (msg.includes('Unknown argument') || msg.includes('Unknown command'))) {
      console.log('\n');
      console.log(yargsInstance.help());
    }

    process.exit(1);
  });

// Error handling for unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${String(promise)}, reason: ${String(reason)}`);
  // Graceful shutdown
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception thrown: ${error.message}`);
  // Graceful shutdown
  process.exit(1);
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('\nReceived SIGINT. Gracefully shutting down...');
  process.exit(0);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

// Print welcome message with CLI version
const welcomeMessage = `
${chalk.bold.blue('Magus Mark CLI')} ${chalk.gray('v' + packageVersion)}
${chalk.gray('AI-powered conversation tagging for Obsidian')}

${chalk.cyan('Quick Start:')}
  ${chalk.white('magus-mark setup')}          Run interactive configuration
  ${chalk.white('magus-mark tag <paths>')}    Tag conversation files
  ${chalk.white('magus-mark --help')}         Show all available commands

${chalk.yellow('Documentation:')} https://github.com/your-org/magus-mark/tree/main/apps/cli
`;

// If no command is provided, show the welcome message
if (process.argv.length === 2) {
  console.log(welcomeMessage);
  console.log(chalk.gray('\nRun "magus-mark --help" to see all available commands.'));
  process.exit(0);
}

// Parse and execute commands
void cli.parse();
