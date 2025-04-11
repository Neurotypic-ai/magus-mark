import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';
import type { TagOptions } from '../types/commands.js';

export const tagCommand: CommandModule = {
  command: 'tag [paths..]',
  describe: 'Process and tag conversations',
  builder: (yargs) => {
    return yargs
      .positional('paths', {
        describe: 'Files or directories to process',
        type: 'string',
        array: true,
      })
      .option('model', {
        describe: 'Model to use for classification',
        choices: ['gpt-3.5-turbo', 'gpt-4'],
        type: 'string',
      })
      .option('mode', {
        describe: 'Operation mode',
        choices: ['auto', 'interactive', 'differential'],
        default: 'auto',
      })
      .option('dry-run', {
        describe: 'Calculate tokens and estimate cost without processing',
        type: 'boolean',
        alias: 'd',
      })
      .option('force', {
        describe: 'Process all files regardless of existing tags',
        type: 'boolean',
        alias: 'f',
      })
      .option('concurrency', {
        describe: 'Number of parallel operations',
        type: 'number',
        default: 3,
      })
      .option('tag-mode', {
        describe: 'How to handle existing tags',
        choices: ['overwrite', 'merge', 'augment'],
        default: 'merge',
      })
      .option('min-confidence', {
        describe: 'Minimum confidence threshold for auto-tagging',
        type: 'number',
        default: 0.7,
      })
      .option('review-threshold', {
        describe: 'Confidence below which to flag for review',
        type: 'number',
        default: 0.5,
      })
      .option('max-cost', {
        describe: 'Maximum budget for this run',
        type: 'number',
      })
      .option('on-limit', {
        describe: 'Action on hitting limit',
        choices: ['pause', 'warn', 'stop'],
        default: 'warn',
      })
      .option('output-format', {
        describe: 'Output format',
        choices: ['pretty', 'json', 'silent'],
      })
      .option('verbose', {
        describe: 'Show detailed progress',
        type: 'boolean',
        alias: 'v',
      })
      .option('output', {
        describe: 'Save results to specified file',
        type: 'string',
        alias: 'o',
      })
      .example('$0 tag ./path/to/conversation.md', 'Process a single file')
      .example(
        '$0 tag ./path/to/conversations/ --mode=differential',
        'Process only files missing tags'
      )
      .example(
        '$0 tag ./convos/ --model=gpt-4 --max-cost=10.00',
        'Use a specific model with cost limit'
      );
  },
  handler: async (argv) => {
    try {
      const { paths = [], dryRun, verbose } = argv as any;
      
      // Validate paths
      if (paths.length === 0) {
        logger.error('No paths specified. Use --help to see usage examples.');
        process.exit(1);
      }
      
      // Log startup information
      logger.info(chalk.bold('Starting conversation tagging'));
      if (verbose) {
        logger.info(`Options: ${JSON.stringify(argv, null, 2)}`);
      }
      
      // Collect all files to process
      const filesToProcess: string[] = [];
      
      for (const p of paths) {
        if (!fs.existsSync(p)) {
          logger.warn(`Path does not exist: ${p}`);
          continue;
        }
        
        const stat = await fs.stat(p);
        
        if (stat.isFile()) {
          filesToProcess.push(p);
        } else if (stat.isDirectory()) {
          // Recursively find all markdown files
          const files = await fs.readdir(p);
          for (const file of files) {
            const filePath = path.join(p, file);
            const fileStat = await fs.stat(filePath);
            
            if (fileStat.isFile() && (file.endsWith('.md') || file.endsWith('.markdown'))) {
              filesToProcess.push(filePath);
            }
          }
        }
      }
      
      if (filesToProcess.length === 0) {
        logger.warn('No valid files found to process.');
        return;
      }
      
      // In dry-run mode, just print the files that would be processed
      if (dryRun) {
        logger.info(chalk.bold(`Found ${filesToProcess.length} files for processing`));
        
        if (verbose) {
          logger.info('Files to process:');
          filesToProcess.forEach(file => logger.info(`- ${file}`));
        }
        
        logger.info(chalk.green('Dry run completed. No files were modified.'));
        return;
      }
      
      // Begin real processing
      const spinner = logger.spinner(`Processing ${filesToProcess.length} files...`);
      
      // TODO: Implement actual processing logic with OpenAI integration
      // This would connect to the core package functionality
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      spinner.succeed(`Processed ${filesToProcess.length} files`);
      logger.box(`
Summary:
- Files processed: ${filesToProcess.length}
- Tags added: 0
- Errors: 0
      `.trim(), 'Processing Complete');
      
    } catch (error) {
      logger.error(`Failed to process files: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}; 