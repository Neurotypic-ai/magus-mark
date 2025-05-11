import * as path from 'node:path';

import chalk from 'chalk';
import * as fs from 'fs-extra';

import { FileUtils } from '@magus-mark/core/utils/FileUtils';
import { Logger } from '@magus-mark/core/utils/Logger';

import { costManager } from '../utils/cost-manager';

import type { CommandModule } from 'yargs';

import type { StatsOptions } from '../types/commands';

// Create a logger instance for this module
const logger = Logger.getInstance('statsCommand');

/**
 * Create a FileUtils instance
 *
 * Factory function following the dependency injection pattern
 */
function createFileUtils(basePath: string): FileUtils {
  return new FileUtils(basePath);
}

/**
 * Interface for usage statistics
 */
interface UsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  files: number;
  successful: number;
  failed: number;
}

/**
 * Interface for cost statistics
 */
interface CostStats {
  total: number;
  prompt: number;
  completion: number;
}

/**
 * Interface for period statistics
 */
interface PeriodStats {
  usage: UsageStats;
  cost: CostStats;
}

/**
 * Interface for tag object
 */
interface Tag {
  name: string;
  confidence?: number;
}

/**
 * Format a number as currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Stats command module
 */
export const statsCommand: CommandModule<Record<string, unknown>, StatsOptions> = {
  command: 'stats',
  describe: 'View statistics and reports',
  builder: (yargs): typeof yargs => {
    return yargs
      .option('period', {
        describe: 'Time period',
        choices: ['day', 'week', 'month', 'all'],
        default: 'month',
      })
      .option('type', {
        describe: 'Statistics type',
        choices: ['usage', 'cost', 'all'],
        default: 'all',
      })
      .option('format', {
        describe: 'Output format',
        choices: ['table', 'json', 'chart'],
        default: 'table',
      })
      .option('directory', {
        describe: 'Directory to analyze (for file-based stats)',
        type: 'string',
        alias: 'd',
      })
      .option('output', {
        describe: 'Save output to file',
        type: 'string',
        alias: 'o',
      })
      .option('reset', {
        describe: 'Reset usage statistics',
        type: 'boolean',
        default: false,
      })
      .example('$0 stats --period=day', "View today's stats")
      .example('$0 stats --type=cost', 'View cost statistics')
      .example('$0 stats --directory=./conversations', 'Analyze files in directory');
  },
  handler: async (argv) => {
    try {
      const { period = 'month', type = 'all', format = 'table', directory, output, reset } = argv;

      // If reset flag is true, reset the usage data
      if (reset) {
        costManager.resetUsageData();
        costManager.saveUsageData();
        logger.info('Usage statistics have been reset.');
      }

      // If directory is specified, run file-based analysis
      if (directory) {
        await runFileAnalysis(directory, format as string, output);
        return;
      }

      // Otherwise, show usage/cost statistics
      const data = getStatsForPeriod(period as string);

      // Display stats based on requested type and format
      if (format === 'json') {
        if (type === 'usage') {
          logger.info(JSON.stringify(data.usage, null, 2));
        } else if (type === 'cost') {
          logger.info(JSON.stringify(data.cost, null, 2));
        } else {
          logger.info(JSON.stringify(data, null, 2));
        }
      } else {
        // Default table format
        const title = `Statistics for ${getPeriodDisplay(period as string)}`;

        if (type === 'usage' || type === 'all') {
          logger.box(
            `
Usage:
- Total tokens: ${data.usage.totalTokens.toLocaleString()}
- Prompt tokens: ${data.usage.promptTokens.toLocaleString()}
- Completion tokens: ${data.usage.completionTokens.toLocaleString()}
- Files processed: ${data.usage.files.toLocaleString()}
- Successful: ${data.usage.successful.toLocaleString()}
- Failed: ${data.usage.failed.toLocaleString()}
          `.trim(),
            type === 'all' ? `${title} - Usage` : title
          );
        }

        if (type === 'cost' || type === 'all') {
          logger.box(
            `
Cost:
- Total: ${formatCurrency(data.cost.total)}
- Prompt: ${formatCurrency(data.cost.prompt)}
- Completion: ${formatCurrency(data.cost.completion)}
          `.trim(),
            type === 'all' ? `${title} - Cost` : title
          );
        }
      }

      if (output) {
        // Write data to file
        const outputData = type === 'usage' ? data.usage : type === 'cost' ? data.cost : data;

        await fs.ensureDir(path.dirname(output));
        await fs.writeJSON(output, outputData, { spaces: 2 });
        logger.info(`Results saved to ${output}`);
      }
    } catch (error) {
      logger.error(`Failed to retrieve statistics: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  },
};

/**
 * Get statistics for a given time period
 */
function getStatsForPeriod(period: string): PeriodStats {
  // Get usage records for the specified period
  const usageRecords = costManager.getUsageHistory(period as 'day' | 'week' | 'month' | 'all');

  // Calculate statistics from records
  const usage: UsageStats = {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    files: usageRecords.length,
    successful: usageRecords.filter((r) => r.operation.includes('success')).length,
    failed: usageRecords.filter((r) => r.operation.includes('failed')).length,
  };

  const cost: CostStats = {
    total: 0,
    prompt: 0,
    completion: 0,
  };

  // Calculate totals from usage records
  for (const record of usageRecords) {
    usage.totalTokens += record.tokens;

    // Estimate prompt vs completion tokens (using a 65/35 split as typical)
    const estimatedPromptTokens = Math.round(record.tokens * 0.65);
    const estimatedCompletionTokens = record.tokens - estimatedPromptTokens;

    usage.promptTokens += estimatedPromptTokens;
    usage.completionTokens += estimatedCompletionTokens;

    cost.total += record.cost;

    // Estimate prompt vs completion costs based on token ratio
    const promptRatio = estimatedPromptTokens / record.tokens;
    const completionRatio = estimatedCompletionTokens / record.tokens;

    cost.prompt += record.cost * promptRatio;
    cost.completion += record.cost * completionRatio;
  }

  return { usage, cost };
}

/**
 * Run file-based analysis on a directory
 */
async function runFileAnalysis(directory: string, format: string, output?: string): Promise<void> {
  // Create FileUtils instance using factory function
  const fileUtils = createFileUtils(directory);

  // Check if the directory exists
  const directoryExists = await fileUtils.fileExists('');
  if (!directoryExists) {
    logger.error(`Directory not found: ${directory}`);
    process.exit(1);
  }

  logger.info(chalk.bold(`Analyzing files in ${directory}...`));

  // Find all markdown files
  const spinner = logger.spinner('Finding files...');
  let files: string[] = [];

  try {
    // Use FileUtils.findFiles to find markdown files
    const findResult = await fileUtils.findFiles('', /\.(md|markdown)$/);

    if (findResult.isFail()) {
      throw findResult.getError();
    }

    files = findResult.getValue();
    spinner.succeed(`Found ${String(files.length)} files`);
  } catch (error) {
    spinner.fail(`Error finding files: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Analyze all files for tags
  const analyzeSpinner = logger.spinner('Analyzing files for tags...');

  // Stats data for analysis
  interface AnalysisStats {
    totalFiles: number;
    filesWithTags: number;
    totalTags: number;
    tagCounts: Map<string, number>;
    domainCounts: Map<string, number>;
  }

  const stats: AnalysisStats = {
    totalFiles: files.length,
    filesWithTags: 0,
    totalTags: 0,
    tagCounts: new Map<string, number>(),
    domainCounts: new Map<string, number>(),
  };

  for (const file of files) {
    try {
      // Use FileUtils to read file contents
      const relativePath = path.relative(directory, file);
      const readResult = await fileUtils.readFile(relativePath);

      if (readResult.isFail()) {
        logger.debug(`Error reading file ${file}: ${readResult.getError().message}`);
        continue;
      }

      const content = readResult.getValue();

      // Extract tags from frontmatter using simple regex pattern
      // This is a simplified version and would be replaced with proper markdown parsing
      const tags = extractTagsFromContent(content);

      if (tags.length > 0) {
        stats.filesWithTags++;
        stats.totalTags += tags.length;

        // Count tag occurrences
        for (const tag of tags) {
          const tagName = tag.name;
          stats.tagCounts.set(tagName, (stats.tagCounts.get(tagName) ?? 0) + 1);

          // Count domain occurrences (assuming the first part of the tag is the domain)
          const domain = tagName.split('/')[0];
          if (domain) {
            stats.domainCounts.set(domain, (stats.domainCounts.get(domain) ?? 0) + 1);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.debug(`Error analyzing file ${file}: ${errorMessage}`);
    }
  }

  analyzeSpinner.succeed(`Analyzed ${String(files.length)} files`);

  // Convert Maps to sorted arrays
  const popularTags = Array.from(stats.tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const domains = Object.fromEntries(Array.from(stats.domainCounts.entries()).sort((a, b) => b[1] - a[1]));

  // Build final stats object
  const finalStats = {
    totalFiles: stats.totalFiles,
    filesWithTags: stats.filesWithTags,
    totalTags: stats.totalTags,
    popularTags,
    domains,
  };

  // Display stats based on format
  if (format === 'json') {
    logger.info(JSON.stringify(finalStats, null, 2));
  } else {
    // Default table format
    const tagsText =
      popularTags.length > 0
        ? popularTags.map((t) => `- ${t.tag}: ${String(t.count)} occurrences`).join('\n')
        : '- No tags found';

    const domainsText =
      Object.keys(domains).length > 0
        ? Object.entries(domains)
            .map(([domain, count]) => {
              const countValue = Number(count);
              const percentage = Math.round((countValue / stats.totalFiles) * 100);
              return `- ${domain}: ${String(countValue)} files (${String(percentage)}%)`;
            })
            .join('\n')
        : '- No domains found';

    logger.box(
      `
Summary:
- Total files: ${String(stats.totalFiles)}
- Files with tags: ${String(stats.filesWithTags)} (${String(Math.round((stats.filesWithTags / stats.totalFiles) * 100))}%)
- Total tags: ${String(stats.totalTags)}

Most Popular Tags:
${tagsText}

Domains:
${domainsText}
    `.trim(),
      'Tag Statistics'
    );
  }

  if (output) {
    // Write stats to file
    await fs.ensureDir(path.dirname(output));
    await fs.writeJSON(output, finalStats, { spaces: 2 });
    logger.info(`Results saved to ${output}`);
  }
}

/**
 * Extract tags from markdown content
 */
function extractTagsFromContent(content: string): Tag[] {
  const tags: Tag[] = [];

  // Look for YAML frontmatter
  const frontmatterMatch = /^---\n([\s\S]*?)\n---/.exec(content);
  if (frontmatterMatch?.[1]) {
    const frontmatter = frontmatterMatch[1];

    // Look for tags in frontmatter
    const tagMatch = /tags:\s*\[([^\]]*)\]/.exec(frontmatter);
    if (tagMatch?.[1]) {
      const tagStrings = tagMatch[1].split(',').map((t) => t.trim());
      for (const tag of tagStrings) {
        if (tag) {
          tags.push({ name: tag.replace(/["']/g, '') });
        }
      }
    }
  }

  // Also look for inline tags in content
  const inlineTagRegex = /#([a-zA-Z0-9\/_-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = inlineTagRegex.exec(content)) !== null) {
    if (match[1]) {
      tags.push({ name: match[1] });
    }
  }

  return tags;
}

/**
 * Get display string for time period
 */
function getPeriodDisplay(period: string): string {
  switch (period) {
    case 'day':
      return 'Today';
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'all':
      return 'All Time';
    default:
      return period;
  }
}
