import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import chalk from 'chalk';
import * as cliProgress from 'cli-progress';
import * as fsExtra from 'fs-extra';

import { OpenAIClient } from '@magus-mark/core/openai/OpenAIClient';
import { TaggingService } from '@magus-mark/core/openai/TaggingService';
import { Logger } from '@magus-mark/core/utils/Logger';

import { TagEditor } from '../ui/tag-editor';
import { config } from '../utils/config';
import { costManager } from '../utils/cost-manager';
import { extractTagsFromFrontmatter, updateTagsInFrontmatter } from '../utils/frontmatter';
import { Workflow } from '../utils/workflow';

import type { AIModel } from '@magus-mark/core/models/AIModel';
import type { Document } from '@magus-mark/core/models/Document';
import type { TagBehavior } from '@magus-mark/core/models/TagBehavior';
import type { TagSet } from '@magus-mark/core/models/TagSet';
import type { CommandModule } from 'yargs';

import type { TagOptions } from '../types/commands';

const logger = Logger.getInstance('cli');

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
      const verbose = options.verbose;
      const model = options.model;
      const tagMode = options.tagMode;
      const minConfidence = options.minConfidence;
      const reviewThreshold = options.reviewThreshold;
      const concurrency = options.concurrency ?? 3;
      const mode = options.mode ?? 'auto';
      const force = options.force ?? false;
      const output = options.output;
      const dryRun = options.dryRun;

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

      // Set up cost management
      if (options.maxCost) {
        costManager.setLimits({
          hardLimit: options.maxCost,
          warningThreshold: options.maxCost * 0.8,
          onLimitReached: options.onLimit ?? 'warn',
        });
      }

      // Initialize workflow for orchestration
      const workflow = new Workflow<void>({
        concurrency,
        retryCount: 3,
        retryDelay: 1000,
        pauseOnError: false,
      });

      // Initialize tag editor for interactive mode
      const tagEditor = new TagEditor({
        minConfidence: minConfidence ?? 0.7,
        reviewThreshold: reviewThreshold ?? 0.5,
      });

      // Log startup information
      logger.info(chalk.bold('Starting conversation tagging'));

      // Add workflow event listeners
      workflow.on('taskComplete', (taskId: string) => {
        logger.debug(`Completed task: ${taskId}`);
      });

      workflow.on('taskError', (taskId: string, error: Error) => {
        logger.error(`Task ${taskId} failed: ${error.message}`);
      });

      // Find all markdown files
      const allFiles: string[] = [];
      for (const inputPath of paths) {
        try {
          if (fsExtra.existsSync(inputPath)) {
            const stat = await fs.stat(inputPath);
            if (stat.isFile() && inputPath.endsWith('.md')) {
              allFiles.push(inputPath);
            } else if (stat.isDirectory()) {
              const files = await findMarkdownFiles(inputPath);
              allFiles.push(...files);
            }
          } else {
            logger.warn(`Path does not exist: ${inputPath}`);
          }
        } catch (error) {
          logger.error(`Error accessing path ${inputPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (allFiles.length === 0) {
        logger.warn('No valid files found to process.');
        return;
      }

      // Initialize tracking variables
      let totalProcessed = 0;
      let totalErrors = 0;
      let totalCost = 0;

      // In dry-run mode, just print the files that would be processed
      if (dryRun) {
        logger.info(chalk.bold(`Found ${String(allFiles.length)} files for processing`));

        if (verbose) {
          logger.info('Files to process:');
          allFiles.forEach((file) => {
            logger.info(`- ${file}`);
          });
        }

        // Calculate more accurate cost estimate using cost manager
        const modelName = model ?? 'gpt-4o';
        let totalEstimatedCost = 0;
        let totalEstimatedTokens = 0;

        for (const file of allFiles) {
          try {
            const content = await fs.readFile(file, 'utf-8');
            // Rough estimation: ~1 token per 4 characters for input, plus ~300 tokens for output
            const inputTokens = Math.ceil(content.length / 4);
            const outputTokens = 300; // Estimated for tag generation

            const estimatedCost = costManager.estimateCost(modelName, {
              input: inputTokens,
              output: outputTokens,
            });

            totalEstimatedCost += estimatedCost;
            totalEstimatedTokens += inputTokens + outputTokens;
          } catch {
            // If we can't read the file, use default estimates
            const defaultInputTokens = 2000;
            const defaultOutputTokens = 300;
            totalEstimatedTokens += defaultInputTokens + defaultOutputTokens;
            totalEstimatedCost += costManager.estimateCost(modelName, {
              input: defaultInputTokens,
              output: defaultOutputTokens,
            });
          }
        }

        logger.box(
          `
📊 Token Usage Estimate
├── Files to process: ${String(allFiles.length)}
├── Model: ${modelName}
├── Estimated total tokens: ~${totalEstimatedTokens.toLocaleString()}
├── Estimated cost: $${totalEstimatedCost.toFixed(4)} USD
│
${options.maxCost ? `├── Your budget: $${options.maxCost.toFixed(2)}` : ''}
${
  options.maxCost && totalEstimatedCost > options.maxCost
    ? `└── ⚠️  Estimated cost exceeds budget!`
    : `└── ✅ Within budget`
}
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
        progressBar.start(allFiles.length, 0);
      }

      // Process files
      const processFile = (filePath: string): void => {
        // Add this task to the workflow
        const taskId = path.relative(process.cwd(), filePath);

        workflow.addTask(
          taskId,
          async () => {
            try {
              const content = await fs.readFile(filePath, 'utf-8');
              const existingTags = extractExistingTags(content);

              // Skip if file already has tags and not forced
              if (existingTags && !force && mode === 'differential') {
                logger.debug(`Skipping ${filePath} - already has tags`);
                return;
              }

              // Create document
              const document: Document = {
                id: path.basename(filePath, '.md'),
                content,
                path: filePath,
                metadata: {
                  wordCount: content.split(/\s+/).length,
                  lastModified: new Date(),
                },
                existingTags,
              };

              // Tag the document
              const result = await taggingService.tagDocument(document);

              if (!result.success || !result.tags) {
                throw new Error(result.error?.message ?? 'Failed to tag document');
              }

              const tagSet = result.tags;

              // Track actual usage and cost
              if (result.usage) {
                const actualCost = costManager.trackUsage(
                  options.model ?? 'gpt-4o',
                  {
                    input: result.usage.inputTokens || 0,
                    output: result.usage.outputTokens || 0,
                  },
                  `process-${path.basename(filePath)}`
                );
                logger.debug(`File ${filePath} cost: $${actualCost.toFixed(4)}`);

                // Check if cost manager is paused due to budget limits
                if (costManager.isPaused()) {
                  throw new Error('Processing paused due to cost limit');
                }
              }

              // In interactive mode, review tags with the tag editor
              if (mode === 'interactive') {
                const tagsWithConfidence = tagSet.topical_tags.map((tag) => ({
                  name: typeof tag === 'object' ? JSON.stringify(tag) : String(tag),
                  confidence: 0.8, // Default confidence, would come from actual tagging service
                }));

                const existingTopicalTags = existingTags?.topical_tags
                  ? existingTags.topical_tags.map((tag) =>
                      typeof tag === 'object' ? JSON.stringify(tag) : String(tag)
                    )
                  : [];

                const reviewResult = await tagEditor.reviewTags(filePath, tagsWithConfidence, existingTopicalTags);

                if (!reviewResult.approved) {
                  logger.info(`Skipping ${filePath} - user cancelled`);
                  return;
                }

                // Update tagSet with user-approved tags
                tagSet.topical_tags = reviewResult.tags as never[];
              }

              // Update file with tags
              await updateFileWithTags(filePath, content, tagSet);
              logger.info(`Tagged: ${chalk.green(filePath)}`);
            } catch (error) {
              logger.error(`Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
              throw error;
            }
          },
          1
        ); // Normal priority
      };

      // Process files using the workflow
      for (const filePath of allFiles) {
        processFile(filePath);
      }

      // Start the workflow
      const workflowResults = await workflow.start();

      // Stop progress bar
      if (mode !== 'interactive') {
        progressBar.stop();
      }

      // Get workflow statistics
      const stats = workflow.getStats();
      totalProcessed = stats.completed;
      totalErrors = stats.failed;

      // Get actual cost data from cost manager
      const sessionStats = costManager.getSessionStats();
      totalCost = sessionStats.totalCost;

      // Save output if requested
      if (output) {
        await fs.writeFile(output, JSON.stringify(workflowResults, null, 2), 'utf-8');
        logger.info(`Results saved to ${output}`);
      }

      // Display summary
      logger.box(
        `
Summary:
- Files processed: ${String(totalProcessed)}
- Files tagged: ${String(totalProcessed)}
- Errors: ${String(totalErrors)}
- Total tokens used: ${sessionStats.totalTokens.toLocaleString()}
- Actual cost: $${totalCost.toFixed(4)}
- Session duration: ${Math.round(sessionStats.duration / 1000)}s
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
  const files = await fs.readdir(dir, { withFileTypes: true });

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
