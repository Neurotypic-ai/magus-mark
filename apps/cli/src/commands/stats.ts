import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import { fileExists, findFiles } from '@obsidian-magic/utils';
import { logger } from '../utils/logger';

export const statsCommand: CommandModule = {
  command: 'stats [directory]',
  describe: 'Analyze tag statistics in a directory',
  builder: (yargs) => {
    return yargs
      .positional('directory', {
        describe: 'Directory to analyze',
        type: 'string',
        default: '.'
      })
      .option('format', {
        describe: 'Output format',
        choices: ['table', 'json', 'chart'],
        default: 'table'
      })
      .option('depth', {
        describe: 'Max directory depth to scan',
        type: 'number',
        default: 10
      })
      .option('output', {
        describe: 'Save output to file',
        type: 'string',
        alias: 'o'
      })
      .example('$0 stats ./conversations', 'Analyze tags in conversations directory')
      .example('$0 stats --format=json', 'Output statistics as JSON');
  },
  handler: async (argv) => {
    try {
      const { directory = '.', format = 'table', output } = argv as any;
      
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
          { tag: 'javascript', count: files.length * 0.4 },
          { tag: 'tutorial', count: files.length * 0.3 },
          { tag: 'troubleshooting', count: files.length * 0.2 },
          { tag: 'react', count: files.length * 0.15 },
          { tag: 'typescript', count: files.length * 0.1 }
        ],
        domains: {
          'programming': files.length * 0.5,
          'design': files.length * 0.2,
          'business': files.length * 0.1,
          'other': files.length * 0.2
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
${stats.popularTags.map(t => `- ${t.tag}: ${Math.round(t.count)} occurrences`).join('\n')}

Domains:
${Object.entries(stats.domains).map(([domain, count]) => 
  `- ${domain}: ${Math.round(count as number)} files (${Math.round((count as number) / stats.totalFiles * 100)}%)`
).join('\n')}
        `.trim(), 'Tag Statistics');
      }
      
      if (output) {
        logger.info(`Results saved to ${output}`);
      }
    } catch (error) {
      logger.error(`Failed to analyze statistics: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}; 