// Use native Node.js fs.promises for file globbing
import { readdir, stat } from 'fs/promises';
import path from 'path';

import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs-extra';

import { OpenAIClient, TaggingService } from '@obsidian-magic/core';
import { logger } from '@obsidian-magic/logger';

import { config } from '../utils/config';
import { extractTagsFromFrontmatter, updateTagsInFrontmatter } from '../utils/frontmatter';

import type { AIModel, Document, TagBehavior, TagSet } from '@obsidian-magic/types';
import type { CommandModule } from 'yargs';

import type { TagOptions } from '../types/commands';

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
        choices: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o'] as AIModel[],
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
        choices: ['append', 'replace', 'merge'] as TagBehavior[],
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
      .example('$0 tag ./path/to/conversations/ --mode=differential', 'Process only files missing tags')
      .example('$0 tag ./convos/ --model=gpt-4 --max-cost=10.00', 'Use a specific model with cost limit');
  },
  handler: async (argv) => {
    try {
      // Parse arguments with proper types
      const options = argv as unknown as TagOptions;
      const {
        verbose,
        model,
        tagMode,
        minConfidence,
        reviewThreshold,
        concurrency = 3,
        mode = 'auto',
        force = false,
        maxCost,
        onLimit = 'warn',
        output,
        dryRun,
      } = options;

      // Get paths array from positional arguments
      const paths = argv['paths'] as string[];

      // Validate paths
      if (paths.length === 0) {
        logger.error('No paths specified. Use --help to see usage examples.');
        process.exit(1);
      }

      // Get API key from environment or config
      const apiKey = process.env['OPENAI_API_KEY'] ?? config.get('apiKey');

      if (!apiKey) {
        logger.error(
          'OpenAI API key not found. Please set OPENAI_API_KEY in your environment or use the config command.'
        );
        process.exit(1);
      }

      // Log startup information
      logger.info(chalk.bold('Starting conversation tagging'));
      if (verbose) {
        logger.info(
          `Options: ${JSON.stringify(
            {
              ...options,
              paths,
            },
            null,
            2
          )}`
        );
      }

      // Collect all files to process
      const filesToProcess: string[] = [];

      for (const p of paths) {
        if (!fs.existsSync(p)) {
          logger.warn(`Path does not exist: ${p}`);
          continue;
        }

        const stats = await stat(p);

        if (stats.isFile()) {
          if (p.endsWith('.md') || p.endsWith('.markdown')) {
            filesToProcess.push(p);
          } else {
            logger.warn(`Skipping non-markdown file: ${p}`);
          }
        } else if (stats.isDirectory()) {
          // Recursively find all markdown files
          await findMarkdownFiles(p, filesToProcess);
        }
      }

      if (filesToProcess.length === 0) {
        logger.warn('No valid files found to process.');
        return;
      }

      // Initialize tracking variables
      let totalProcessed = 0;
      let totalTagged = 0;
      let totalErrors = 0;
      let totalCost = 0;
      let fileResults: Record<string, { success: boolean; tags?: TagSet; error?: unknown }> = {};

      // In dry-run mode, just print the files that would be processed
      if (dryRun) {
        logger.info(chalk.bold(`Found ${String(filesToProcess.length)} files for processing`));

        if (verbose) {
          logger.info('Files to process:');
          filesToProcess.forEach((file) => {
            logger.info(`- ${file}`);
          });
        }

        // Calculate rough cost estimate
        // Assuming ~2000 tokens per file on average
        const tokenEstimate = filesToProcess.length * 2000;
        const modelName = model ?? 'gpt-4o';
        const isGpt4Model = modelName === 'gpt-4' || modelName === 'gpt-4o';
        // GPT-4 models cost roughly $0.01 per 1K tokens, GPT-3.5 around $0.002
        const costEstimate = isGpt4Model ? (tokenEstimate / 1000) * 0.01 : (tokenEstimate / 1000) * 0.002;

        logger.box(
          `
Cost Estimate:
- Files: ${String(filesToProcess.length)}
- Estimated tokens: ~${String(tokenEstimate)}
- Estimated cost: $${costEstimate.toFixed(2)}
        `.trim(),
          'Dry Run Summary'
        );

        logger.info(chalk.green('Dry run completed. No files were modified.'));
        return;
      }

      // Initialize OpenAI client and tagging service
      const openAIClient = new OpenAIClient({
        apiKey,
        model: model ?? 'gpt-4o',
      });

      const taggingService = new TaggingService(openAIClient, {
        model: model ?? 'gpt-4o',
        behavior: tagMode ?? 'merge',
        minConfidence: minConfidence ?? 0.65,
        reviewThreshold: reviewThreshold ?? 0.85,
      });

      // Initialize progress bar
      const progressBar = new cliProgress.SingleBar(
        {
          format: `Tagging Progress | ${chalk.cyan('{bar}')} | {percentage}% | {value}/{total} files`,
          barCompleteChar: '█',
          barIncompleteChar: '░',
        },
        cliProgress.Presets.shades_classic
      );

      if (mode !== 'interactive') {
        progressBar.start(filesToProcess.length, 0);
      }

      // Process files
      const processFile = async (filePath: string): Promise<void> => {
        try {
          // Read file content
          const content = await fs.readFile(filePath, 'utf-8');

          // Extract existing tags from frontmatter
          const existingTags = extractExistingTags(content);

          // Skip files that already have tags if not in force mode and in differential mode
          if (!force && mode === 'differential' && existingTags && Object.keys(existingTags).length > 0) {
            if (verbose) {
              logger.info(`Skipping already tagged file: ${filePath}`);
            }
            return;
          }

          // Create document object and handle undefined existingTags
          // Instead of creating an empty TagSet which may not match the expected structure,
          // we'll let the TaggingService handle the undefined case internally
          const document: Document = {
            id: path.basename(filePath, path.extname(filePath)),
            content,
            path: filePath,
            metadata: {},
            existingTags,
          };

          // Tag the document
          const result = await taggingService.tagDocument(document);

          if (!result.success) {
            totalErrors++;
            logger.error(`Failed to tag file ${filePath}: ${String(result.error?.message)}`);
            fileResults[filePath] = { success: false, error: result.error };
            return;
          }

          // In interactive mode, prompt for confirmation before updating
          if (mode === 'interactive') {
            // Since we checked result.success, we know result.tags exists
            if (result.tags) {
              const shouldUpdate = await promptForConfirmation(filePath, result.tags);
              if (!shouldUpdate) {
                logger.info(`Skipping file: ${filePath}`);
                return;
              }
            } else {
              logger.warn(`No tags were generated for ${filePath}`);
              return;
            }
          }

          // Update the file with new tags (with proper type guard check)
          if (result.tags) {
            await updateFileWithTags(filePath, content, result.tags);

            totalTagged++;
            totalProcessed++;

            // Store results for output
            fileResults[filePath] = {
              success: true,
              tags: result.tags,
            };
          } else {
            logger.warn(`No tags were generated for ${filePath}`);
            fileResults[filePath] = {
              success: false,
              error: 'No tags were generated',
            };
          }

          // Update progress
          if (mode !== 'interactive') {
            progressBar.increment();
          } else {
            logger.info(`Tagged file: ${filePath}`);
          }
        } catch (error) {
          totalErrors++;
          logger.error(`Error processing file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          fileResults[filePath] = { success: false, error: String(error) };
        }
      };

      // Configure concurrency limits
      const batchSize = Math.min(concurrency, filesToProcess.length);
      const batches = [];

      // Split files into batches
      for (let i = 0; i < filesToProcess.length; i += batchSize) {
        batches.push(filesToProcess.slice(i, i + batchSize));
      }

      // Process batches
      for (const batch of batches) {
        await Promise.all(batch.map((file) => processFile(file)));

        // Check if we've hit the cost limit
        if (maxCost && totalCost >= maxCost) {
          if (onLimit === 'stop') {
            logger.warn(`Cost limit of $${String(maxCost)} reached. Stopping processing.`);
            break;
          } else if (onLimit === 'pause') {
            const { continue: shouldContinue } = await promptUserForContinue(maxCost);

            if (!shouldContinue) {
              logger.warn('Processing stopped by user.');
              break;
            }
          } else {
            logger.warn(`Cost limit of $${String(maxCost)} reached, but continuing as requested.`);
          }
        }
      }

      // Stop progress bar
      if (mode !== 'interactive') {
        progressBar.stop();
      }

      // Save output if requested
      if (output) {
        await fs.writeFile(output, JSON.stringify(fileResults, null, 2), 'utf-8');
        logger.info(`Results saved to ${output}`);
      }

      // Display summary
      logger.box(
        `
Summary:
- Files processed: ${String(totalProcessed)}
- Files tagged: ${String(totalTagged)}
- Errors: ${String(totalErrors)}
- Estimated cost: $${totalCost.toFixed(2)}
      `.trim(),
        'Processing Complete'
      );
    } catch (error) {
      logger.error(`Failed to process files: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  },
};

/**
 * Recursively find markdown files in a directory
 */
async function findMarkdownFiles(dir: string, results: string[] = []): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await findMarkdownFiles(fullPath, results);
    } else if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.markdown'))) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Extract existing tags from frontmatter
 */
function extractExistingTags(content: string): TagSet | undefined {
  return extractTagsFromFrontmatter(content);
}

/**
 * Update file with new tags
 */
async function updateFileWithTags(filePath: string, content: string, tags: TagSet): Promise<void> {
  // Update content with new tags in frontmatter
  const updatedContent = updateTagsInFrontmatter(content, tags);

  // Write the updated content back to the file
  await fs.writeFile(filePath, updatedContent, 'utf-8');

  logger.debug(`Updated file ${filePath} with tags`);
}

/**
 * Prompt for confirmation in interactive mode
 */
async function promptForConfirmation(filePath: string, tags: TagSet): Promise<boolean> {
  console.log('\n' + chalk.bold(`File: ${filePath}`));
  console.log(chalk.cyan('Proposed tags:'));
  console.log(JSON.stringify(tags, null, 2));

  // Simple prompt for yes/no
  return new Promise((resolve) => {
    console.log('Apply these tags? (y/n)');

    const handleInput = (data: Buffer) => {
      const input = data.toString().trim().toLowerCase();
      process.stdin.removeListener('data', handleInput);
      process.stdin.pause();
      resolve(input === 'y' || input === 'yes');
    };

    process.stdin.resume();
    process.stdin.once('data', handleInput);
  });
}

/**
 * Prompt user whether to continue after hitting cost limit
 */
async function promptUserForContinue(maxCost: number): Promise<{ continue: boolean }> {
  console.log(`\nCost limit of $${String(maxCost)} reached. Continue processing? (y/n)`);

  // Simple prompt for yes/no
  const shouldContinue = await new Promise<boolean>((resolve) => {
    const handleInput = (data: Buffer) => {
      const input = data.toString().trim().toLowerCase();
      process.stdin.removeListener('data', handleInput);
      process.stdin.pause();
      resolve(input === 'y' || input === 'yes');
    };

    process.stdin.resume();
    process.stdin.once('data', handleInput);
  });

  return { continue: shouldContinue };
}
