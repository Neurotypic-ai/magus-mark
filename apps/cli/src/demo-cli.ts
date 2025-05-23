/**
 * Magus Mark - God Tier Dashboard Demo CLI
 * Standalone demo showcasing the most badass CLI dashboard ever created
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { demoDashboardCommand } from './commands/demo-dashboard';

import type { ArgumentsCamelCase } from 'yargs';

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
  .scriptName('magus-mark-demo')
  .version(packageVersion)
  .strict()
  .demandCommand(1, 'You must provide a command')
  .help()
  .showHelpOnFail(true)
  .wrap(120)
  .epilogue('🔥 Experience the most BADASS CLI dashboard ever created! 🔥')
  .middleware((argv: ArgumentsCamelCase<Record<string, unknown>>) => {
    // Global middleware
    const verbose = argv['verbose'] as boolean | undefined;
    if (verbose) {
      console.log(`🚀 Magus Mark Demo CLI v${packageVersion} starting...`);
    }
  })
  .command(demoDashboardCommand)
  .option('verbose', {
    describe: 'Show detailed output',
    type: 'boolean',
    alias: 'v',
    global: true,
  })
  .example('$0 demo', 'Launch the God Tier dashboard demo')
  .example('$0 demo --theme=cyberpunk --duration=60', 'Cyberpunk theme demo for 1 minute')
  .example('$0 demo --theme=hacker', 'Hacker theme demo')
  .fail((msg, err) => {
    if (err) {
      console.error(`💥 Error: ${err.message}`);
    } else if (msg) {
      console.error(`💥 Error: ${msg}`);
    }

    console.log('\n🚀 Run with --help to see available commands and options.');
    process.exit(1);
  });

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(`💥 Unhandled Rejection at: ${String(promise)}, reason: ${String(reason)}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(`💥 Uncaught Exception thrown: ${error.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

// Welcome message
const welcomeMessage = `
🔥🔥🔥 MAGUS MARK - GOD TIER DASHBOARD DEMO 🔥🔥🔥

The most BADASS CLI dashboard demo ever created!

🚀 Quick Start:
  magus-mark-demo demo                    Launch Matrix dashboard demo
  magus-mark-demo demo --theme=cyberpunk  Cyberpunk theme
  magus-mark-demo demo --theme=hacker     Hacker theme  
  magus-mark-demo --help                  Show all options

💎 Experience maximum badassery in terminal form!
`;

// If no command provided, show welcome
if (process.argv.length === 2) {
  console.log(welcomeMessage);
  console.log('🎯 Run "magus-mark-demo demo" to launch the ultimate dashboard!\n');
  process.exit(0);
}

// Parse and execute
void cli.parse();
