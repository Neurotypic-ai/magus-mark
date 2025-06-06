#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

import chalk from 'chalk';
import fs from 'fs-extra';

const execAsync = promisify(exec);

async function build() {
  console.log(chalk.blue('Building CLI application...'));

  try {
    // Ensure directories exist
    await fs.ensureDir('./dist');
    await fs.ensureDir('./bin');

    // Check if bin script exists, if not create it
    const binFile = './bin/magus-mark.js';
    const binContent = `#!/usr/bin/env node

import('../dist/cli.js').catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
`;

    if (!(await fs.pathExists(binFile))) {
      console.log(chalk.yellow('Creating bin script...'));
      await fs.writeFile(binFile, binContent);
      await fs.chmod(binFile, '755'); // Make executable
    }

    // Run esbuild
    console.log(chalk.yellow('Building with esbuild...'));
    await execAsync('tsx esbuild.config.ts');

    console.log(chalk.green('Build completed successfully!'));
  } catch (error) {
    console.error(chalk.red('Build failed:'), error);
    process.exit(1);
  }
}

build();
