#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { config as dotenvConfig } from 'dotenv';
import chalk from 'chalk';

// Load environment variables from .env file
dotenvConfig();

// Import command modules
import { tagCommand } from './commands/tag.js';
import { testCommand } from './commands/test.js';
import { configCommand } from './commands/config.js';
import { statsCommand } from './commands/stats.js';
import { taxonomyCommand } from './commands/taxonomy.js';

// Get version from package.json
const version = '0.1.0'; // This would normally be imported from package.json

/**
 * Main CLI application
 */
async function main() {
  try {
    await yargs(hideBin(process.argv))
      .scriptName('tag-conversations')
      .usage('$0 <command> [options]')
      .version(version)
      .command(tagCommand)
      .command(testCommand)
      .command(configCommand)
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
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
