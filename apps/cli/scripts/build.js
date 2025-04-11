#!/usr/bin/env node

import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function build() {
  console.log(chalk.blue('Building CLI application...'));

  try {
    // Ensure directories exist
    await fs.ensureDir('./dist');
    await fs.ensureDir('./bin');

    // Check if bin script exists, if not create it
    const binFile = './bin/tag-conversations.js';
    const binContent = `#!/usr/bin/env node

import('../dist/index.js').catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
`;

    if (!await fs.pathExists(binFile)) {
      console.log(chalk.yellow('Creating bin script...'));
      await fs.writeFile(binFile, binContent);
      await fs.chmod(binFile, '755'); // Make executable
    }

    // Run TypeScript compiler
    console.log(chalk.yellow('Compiling TypeScript...'));
    await execAsync('tsc -b');

    console.log(chalk.green('Build completed successfully!'));
  } catch (error) {
    console.error(chalk.red('Build failed:'), error);
    process.exit(1);
  }
}

build(); 