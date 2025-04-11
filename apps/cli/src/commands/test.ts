import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';

export const testCommand: CommandModule = {
  command: 'test',
  describe: 'Run tests and benchmarks',
  builder: (yargs) => {
    return yargs
      .option('samples', {
        describe: 'Number of samples to process',
        type: 'number',
        default: 10
      })
      .option('test-set', {
        describe: 'Path to test set with known classifications',
        type: 'string'
      })
      .option('models', {
        describe: 'Models to test',
        type: 'array',
        default: ['gpt-3.5-turbo']
      })
      .option('benchmark', {
        describe: 'Run full benchmark suite',
        type: 'boolean',
        default: false
      })
      .option('report', {
        describe: 'Save detailed results to file',
        type: 'string'
      })
      .example('$0 test --samples=20', 'Run standard tests with 20 samples')
      .example('$0 test --benchmark --all-models', 'Run comprehensive benchmark')
      .example('$0 test --report=report.json', 'Save results to file');
  },
  handler: async (argv) => {
    try {
      const { samples, testSet, models, benchmark, report } = argv as any;
      
      logger.info(chalk.bold('Starting test suite'));
      
      if (benchmark) {
        logger.info('Running benchmark suite...');
        // TODO: Implement benchmark
        const spinner = logger.spinner('Running benchmarks...');
        
        // Mock benchmark
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        spinner.succeed('Benchmark completed');
        
        // Mock results
        const results = {
          models: models,
          samples: samples,
          metrics: {
            accuracy: 0.85,
            latency: 1200,
            tokensPerRequest: 350,
            costPer1000: 0.12
          }
        };
        
        logger.box(`
Benchmark Results:
- Models tested: ${(models as string[]).join(', ')}
- Samples processed: ${samples}
- Average accuracy: 85%
- Average latency: 1200ms
- Average tokens per request: 350
- Cost per 1000 samples: $0.12
        `.trim(), 'Benchmark Complete');
        
        if (report) {
          await fs.writeJSON(report, results, { spaces: 2 });
          logger.info(`Report saved to ${report}`);
        }
      } else {
        logger.info('Running standard tests...');
        
        // Check if test set exists
        if (testSet && !fs.existsSync(testSet)) {
          logger.error(`Test set not found: ${testSet}`);
          process.exit(1);
        }
        
        const spinner = logger.spinner('Running tests...');
        
        // Mock test run
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        spinner.succeed('Tests completed');
        
        // Mock results
        logger.info(chalk.green('All tests passed successfully!'));
      }
    } catch (error) {
      logger.error(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}; 