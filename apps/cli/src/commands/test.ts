import type { CommandModule } from 'yargs';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { benchmark } from '../utils/benchmark.js';
import type { TestOptions } from '../types/commands';
import type { AIModel } from '@obsidian-magic/types';

/**
 * Test and benchmark command
 */
export const testCommand: CommandModule = {
  command: 'test',
  describe: 'Run tests and benchmarks',
  builder: (yargs) => {
    return yargs
      .option('benchmark', {
        describe: 'Run performance benchmark',
        type: 'boolean',
        default: false
      })
      .option('samples', {
        describe: 'Number of samples to test',
        type: 'number',
        default: 10
      })
      .option('test-set', {
        describe: 'Path to test set file or directory',
        type: 'string'
      })
      .option('models', {
        describe: 'Models to test (comma-separated)',
        type: 'string',
        default: 'gpt-3.5-turbo,gpt-4'
      })
      .option('report', {
        describe: 'Path to save report',
        type: 'string'
      })
      .option('verbose', {
        describe: 'Show detailed output',
        type: 'boolean',
        alias: 'v',
        default: false
      })
      .option('output-format', {
        describe: 'Output format',
        choices: ['pretty', 'json', 'silent'],
        default: 'pretty'
      })
      .example('$0 test --benchmark', 'Run a basic benchmark')
      .example('$0 test --models=gpt-3.5-turbo,gpt-4 --samples=20', 'Benchmark specific models')
      .example('$0 test --test-set=./test-cases.json', 'Use a custom test set');
  },
  handler: async (argv) => {
    try {
      // Parse arguments with proper types
      const options = argv as unknown as TestOptions;
      const { 
        benchmark: runBenchmark, 
        samples, 
        testSet, 
        report, 
        verbose,
        outputFormat
      } = options;
      
      // Configure logger
      logger.configure({
        logLevel: verbose ? 'debug' : 'info',
        outputFormat: outputFormat
      });
      
      // Parse models
      const modelsArg = (argv.models as string) || 'gpt-3.5-turbo';
      const models = modelsArg.split(',').map(m => m.trim()) as AIModel[];
      
      if (models.length === 0) {
        logger.error('No models specified. Use --models option to specify models to test.');
        process.exit(1);
      }
      
      if (runBenchmark) {
        await runBenchmarkCommand(models, options);
      } else {
        logger.info('No action specified. Use --benchmark to run benchmarks.');
        logger.info('Example: tag-conversations test --benchmark');
      }
    } catch (error) {
      logger.error(`Test command failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
};

/**
 * Run benchmark
 */
async function runBenchmarkCommand(models: AIModel[], options: TestOptions): Promise<void> {
  logger.info(chalk.bold('Running benchmark'));
  logger.info(`Models: ${models.join(', ')}`);
  logger.info(`Samples: ${options.samples || 10}`);
  
  if (options.testSet) {
    logger.info(`Test set: ${options.testSet}`);
  }
  
  const result = await benchmark.runBenchmark({
    models,
    samples: options.samples,
    testSet: options.testSet,
    reportPath: options.report,
    saveReport: !!options.report
  });
  
  if (result.isFail()) {
    logger.error(`Benchmark failed: ${result.getError().message}`);
    return;
  }
  
  const report = result.getValue();
  
  // Additional summary information
  logger.info(chalk.bold.green('\nBenchmark completed successfully!'));
  
  // Store benchmark results in config if needed
  // This could be used for tracking improvements over time
  
  if (options.report) {
    logger.info(`Full report saved to: ${options.report}`);
  }
} 