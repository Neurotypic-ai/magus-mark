import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import { fileExists, findFiles } from '@obsidian-magic/utils';
import { logger } from '../utils/logger';
import { formatCurrency } from '../mocks/utils';

// Mock usage data
const mockUsageData = {
  day: {
    usage: {
      totalTokens: 12500,
      promptTokens: 8000,
      completionTokens: 4500,
      files: 25,
      successful: 22,
      failed: 3
    },
    cost: {
      total: 0.025,
      prompt: 0.016,
      completion: 0.009
    }
  },
  week: {
    usage: {
      totalTokens: 87500,
      promptTokens: 56000,
      completionTokens: 31500,
      files: 175,
      successful: 165,
      failed: 10
    },
    cost: {
      total: 0.175,
      prompt: 0.112,
      completion: 0.063
    }
  },
  month: {
    usage: {
      totalTokens: 350000,
      promptTokens: 224000,
      completionTokens: 126000,
      files: 700,
      successful: 650,
      failed: 50
    },
    cost: {
      total: 0.70,
      prompt: 0.448,
      completion: 0.252
    }
  },
  all: {
    usage: {
      totalTokens: 1050000,
      promptTokens: 672000,
      completionTokens: 378000,
      files: 2100,
      successful: 1950,
      failed: 150
    },
    cost: {
      total: 2.10,
      prompt: 1.344,
      completion: 0.756
    }
  }
};

export const statsCommand: CommandModule = {
  command: 'stats',
  describe: 'View statistics and reports',
  builder: (yargs) => {
    return yargs
      .option('period', {
        describe: 'Time period',
        choices: ['day', 'week', 'month', 'all'],
        default: 'month'
      })
      .option('type', {
        describe: 'Statistics type',
        choices: ['usage', 'cost', 'all'],
        default: 'all'
      })
      .option('format', {
        describe: 'Output format',
        choices: ['table', 'json', 'chart'],
        default: 'table'
      })
      .option('directory', {
        describe: 'Directory to analyze (for file-based stats)',
        type: 'string',
        alias: 'd'
      })
      .option('output', {
        describe: 'Save output to file',
        type: 'string',
        alias: 'o'
      })
      .example('$0 stats --period=day', 'View today\'s stats')
      .example('$0 stats --type=cost', 'View cost statistics')
      .example('$0 stats --directory=./conversations', 'Analyze files in directory');
  },
  handler: async (argv) => {
    try {
      const { period = 'month', type = 'all', format = 'table', directory, output } = argv as any;
      
      // If directory is specified, run file-based analysis
      if (directory) {
        await runFileAnalysis(directory, format, output);
        return;
      }
      
      // Otherwise, show usage/cost statistics
      const data = mockUsageData[period as keyof typeof mockUsageData];
      
      if (!data) {
        logger.error(`Invalid period: ${period}`);
        process.exit(1);
      }
      
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
        const title = `Statistics for ${getPeriodDisplay(period)}`;
        
        if (type === 'usage' || type === 'all') {
          logger.box(`
Usage:
- Total tokens: ${data.usage.totalTokens.toLocaleString()}
- Prompt tokens: ${data.usage.promptTokens.toLocaleString()}
- Completion tokens: ${data.usage.completionTokens.toLocaleString()}
- Files processed: ${data.usage.files.toLocaleString()}
- Successful: ${data.usage.successful.toLocaleString()}
- Failed: ${data.usage.failed.toLocaleString()}
          `.trim(), type === 'all' ? `${title} - Usage` : title);
        }
        
        if (type === 'cost' || type === 'all') {
          logger.box(`
Cost:
- Total: ${formatCurrency(data.cost.total)}
- Prompt: ${formatCurrency(data.cost.prompt)}
- Completion: ${formatCurrency(data.cost.completion)}
          `.trim(), type === 'all' ? `${title} - Cost` : title);
        }
      }
      
      if (output) {
        // In real implementation, would write to file
        logger.info(`Results saved to ${output}`);
      }
    } catch (error) {
      logger.error(`Failed to retrieve statistics: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
};

/**
 * Run file-based analysis on a directory
 */
async function runFileAnalysis(directory: string, format: string, output?: string): Promise<void> {
  if (!(await fileExists(directory))) {
    logger.error(`Directory not found: ${directory}`);
    process.exit(1);
  }
  
  logger.info(chalk.bold(`Analyzing files in ${directory}...`));
  
  // Find all markdown files
  const spinner = logger.spinner('Finding files...');
  const files = await findFiles(directory, '**/*.{md,markdown}');
  spinner.succeed(`Found ${files.length} files`);
  
  // Mock stats generation (would actually analyze files in real implementation)
  const stats = {
    totalFiles: files.length,
    filesWithTags: Math.floor(files.length * 0.75),
    totalTags: files.length * 3,
    popularTags: [
      { tag: 'javascript', count: Math.floor(files.length * 0.4) },
      { tag: 'tutorial', count: Math.floor(files.length * 0.3) },
      { tag: 'troubleshooting', count: Math.floor(files.length * 0.2) },
      { tag: 'react', count: Math.floor(files.length * 0.15) },
      { tag: 'typescript', count: Math.floor(files.length * 0.1) }
    ],
    domains: {
      'programming': Math.floor(files.length * 0.5),
      'design': Math.floor(files.length * 0.2),
      'business': Math.floor(files.length * 0.1),
      'other': Math.floor(files.length * 0.2)
    }
  };
  
  // Display stats based on format
  if (format === 'json') {
    logger.info(JSON.stringify(stats, null, 2));
  } else {
    // Default table format
    logger.box(`
Summary:
- Total files: ${stats.totalFiles}
- Files with tags: ${stats.filesWithTags} (${Math.round(stats.filesWithTags / stats.totalFiles * 100)}%)
- Total tags: ${stats.totalTags}

Most Popular Tags:
${stats.popularTags.map(t => `- ${t.tag}: ${t.count} occurrences`).join('\n')}

Domains:
${Object.entries(stats.domains).map(([domain, count]) => 
  `- ${domain}: ${count} files (${Math.round((count) / stats.totalFiles * 100)}%)`
).join('\n')}
    `.trim(), 'Tag Statistics');
  }
  
  if (output) {
    // In real implementation, would write to file
    logger.info(`Results saved to ${output}`);
  }
}

/**
 * Get display string for time period
 */
function getPeriodDisplay(period: string): string {
  switch(period) {
    case 'day': return 'Today';
    case 'week': return 'This Week';
    case 'month': return 'This Month';
    case 'all': return 'All Time';
    default: return period;
  }
} 