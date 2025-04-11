import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';

export const statsCommand: CommandModule = {
  command: 'stats',
  describe: 'View statistics and reports',
  builder: (yargs) => {
    return yargs
      .option('period', {
        describe: 'Time period for stats',
        choices: ['day', 'week', 'month', 'all'],
        default: 'all'
      })
      .option('type', {
        describe: 'Type of statistics to show',
        choices: ['usage', 'cost', 'all'],
        default: 'all'
      })
      .option('output', {
        describe: 'Save results to specified file',
        type: 'string'
      })
      .option('output-format', {
        describe: 'Output format',
        choices: ['pretty', 'json', 'silent'],
        default: 'pretty'
      })
      .example('$0 stats', 'Show all statistics')
      .example('$0 stats --period=day', 'Show statistics for today')
      .example('$0 stats --type=cost', 'Show cost statistics');
  },
  handler: async (argv) => {
    try {
      const { period, type, output } = argv as any;
      
      logger.info(chalk.bold(`Showing statistics for period: ${period}, type: ${type}`));
      
      // Mock statistics
      const mockStats = {
        period,
        type,
        summary: {
          totalFiles: 125,
          totalTokens: 1250000,
          totalCost: 2.50,
          averageTokensPerFile: 10000,
          averageCostPerFile: 0.02
        },
        modelBreakdown: {
          'gpt-3.5-turbo': {
            files: 100,
            tokens: 900000,
            cost: 1.80
          },
          'gpt-4': {
            files: 25,
            tokens: 350000,
            cost: 0.70
          }
        }
      };
      
      // Display statistics
      logger.box(`
Statistics Summary (${period}):
- Total files processed: ${mockStats.summary.totalFiles}
- Total tokens used: ${mockStats.summary.totalTokens.toLocaleString()}
- Total cost: $${mockStats.summary.totalCost.toFixed(2)}
- Average tokens per file: ${mockStats.summary.averageTokensPerFile.toLocaleString()}
- Average cost per file: $${mockStats.summary.averageCostPerFile.toFixed(4)}

Model Breakdown:
- GPT-3.5 Turbo: ${mockStats.modelBreakdown['gpt-3.5-turbo'].files} files, ${mockStats.modelBreakdown['gpt-3.5-turbo'].tokens.toLocaleString()} tokens, $${mockStats.modelBreakdown['gpt-3.5-turbo'].cost.toFixed(2)}
- GPT-4: ${mockStats.modelBreakdown['gpt-4'].files} files, ${mockStats.modelBreakdown['gpt-4'].tokens.toLocaleString()} tokens, $${mockStats.modelBreakdown['gpt-4'].cost.toFixed(2)}
      `.trim(), 'Usage Statistics');
      
      // Save to file if requested
      if (output) {
        await fs.writeJSON(output, mockStats, { spaces: 2 });
        logger.info(`Statistics saved to ${output}`);
      }
    } catch (error) {
      logger.error(`Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}; 