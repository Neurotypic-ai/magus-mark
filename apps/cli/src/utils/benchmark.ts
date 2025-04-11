import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { logger } from './logger';
import { costManager } from './cost-manager';
import { Result, AppError, FileSystemError, ValidationError } from './errors';
import type { AIModel } from '@obsidian-magic/types';

/**
 * Benchmark report for a single model
 */
interface ModelBenchmarkReport {
  model: AIModel;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  costIncurred: {
    input: number;
    output: number;
    total: number;
  };
  latency: {
    average: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
  };
  samples: number;
  failedSamples: number;
  duration: number;
}

/**
 * Benchmark report
 */
interface BenchmarkReport {
  timestamp: string;
  models: ModelBenchmarkReport[];
  summary: {
    bestOverall: AIModel;
    bestAccuracy: AIModel;
    bestCostEfficiency: AIModel;
    bestLatency: AIModel;
  };
  settings: {
    samples: number;
    testSet: string;
  };
}

/**
 * Benchmark run options
 */
interface BenchmarkOptions {
  models: AIModel[];
  samples?: number;
  testSet?: string;
  saveReport?: boolean;
  reportPath?: string;
}

/**
 * Test case for benchmarking
 */
interface TestCase {
  id: string;
  content: string;
  expectedTags: string[];
}

/**
 * Benchmark run result
 */
interface BenchmarkRunResult {
  success: boolean;
  model: AIModel;
  testCase: TestCase;
  suggestedTags: string[];
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  costIncurred: {
    input: number;
    output: number;
    total: number;
  };
  duration: number;
  error?: Error;
}

/**
 * Benchmark utility for evaluating model performance
 */
export class Benchmark {
  private static instance: Benchmark;
  private testCases: TestCase[] = [];
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): Benchmark {
    if (!Benchmark.instance) {
      Benchmark.instance = new Benchmark();
    }
    return Benchmark.instance;
  }
  
  /**
   * Load test cases from file or directory
   */
  public async loadTestCases(testSetPath: string): Promise<Result<TestCase[]>> {
    try {
      const fullPath = path.isAbsolute(testSetPath) 
        ? testSetPath 
        : path.resolve(process.cwd(), testSetPath);
      
      if (!fs.existsSync(fullPath)) {
        return Result.fail(new FileSystemError(`Test set path does not exist: ${fullPath}`, {
          code: 'FILE_NOT_FOUND',
          context: { path: fullPath }
        }));
      }
      
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        // Load all .json files in the directory
        const files = await fs.readdir(fullPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const testCases: TestCase[] = [];
        
        for (const file of jsonFiles) {
          const filePath = path.join(fullPath, file);
          const fileContent = await fs.readJson(filePath);
          
          if (Array.isArray(fileContent)) {
            testCases.push(...fileContent);
          } else {
            testCases.push(fileContent);
          }
        }
        
        this.testCases = testCases;
        return Result.ok(testCases);
        
      } else if (stats.isFile() && fullPath.endsWith('.json')) {
        // Load a single JSON file
        const fileContent = await fs.readJson(fullPath);
        
        if (Array.isArray(fileContent)) {
          this.testCases = fileContent;
        } else {
          this.testCases = [fileContent];
        }
        
        return Result.ok(this.testCases);
      } else {
        return Result.fail(new ValidationError(`Test set path must be a JSON file or directory: ${fullPath}`, {
          code: 'INVALID_FILE_TYPE',
          context: { path: fullPath }
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(new AppError(error.message, {
          code: 'LOAD_TEST_CASE_ERROR',
          cause: error
        }));
      }
      return Result.fail(new AppError(`Failed to load test cases: ${String(error)}`, {
        code: 'UNKNOWN_ERROR'
      }));
    }
  }
  
  /**
   * Run benchmark
   */
  public async runBenchmark(options: BenchmarkOptions): Promise<Result<BenchmarkReport>> {
    const { models, samples = 10, testSet, saveReport = true, reportPath } = options;
    
    if (!models || models.length === 0) {
      return Result.fail(new ValidationError('No models specified for benchmarking', {
        code: 'INVALID_PARAMETER'
      }));
    }
    
    
    if (this.testCases.length === 0) {
      return Result.fail(new ValidationError('No test cases available for benchmarking', {
        code: 'NO_TEST_CASES'
      }));
    }
    
    // Limit samples to available test cases
    const sampleSize = Math.min(samples, this.testCases.length);
    const selectedTestCases = this.testCases.slice(0, sampleSize);
    
    logger.info(chalk.bold(`Starting benchmark with ${models.length} models and ${sampleSize} samples`));
    
    const modelReports: ModelBenchmarkReport[] = [];
    const startTime = Date.now();
    
    // Run benchmark for each model
    for (const model of models) {
      logger.info(`\nBenchmarking model: ${chalk.cyan(model)}`);
      
      const modelStartTime = Date.now();
      const runResults: BenchmarkRunResult[] = [];
      
      // Process each test case
      for (let i = 0; i < selectedTestCases.length; i++) {
        const testCase = selectedTestCases[i]!;
        logger.info(`  Processing test case ${i + 1}/${selectedTestCases.length}: ${testCase.id}`);
        
        const runResult = await this.runTestCase(model, testCase);
        runResults.push(runResult);
        
        // Log progress
        if (runResult.success) {
          logger.info(`    ${chalk.green('✓')} Success (${runResult.duration.toFixed(2)}ms, ${runResult.tokensUsed.total} tokens, $${runResult.costIncurred.total.toFixed(4)})`);
        } else {
          logger.info(`    ${chalk.red('✗')} Failed (${runResult.error?.message || 'Unknown error'})`);
        }
      }
      
      // Calculate metrics
      const successfulRuns = runResults.filter(result => result.success);
      const failedRuns = runResults.filter(result => !result.success);
      
      // Calculate token usage and cost
      const tokensUsed = {
        input: successfulRuns.reduce((sum, run) => sum + run.tokensUsed.input, 0),
        output: successfulRuns.reduce((sum, run) => sum + run.tokensUsed.output, 0),
        total: successfulRuns.reduce((sum, run) => sum + run.tokensUsed.total, 0)
      };
      
      const costIncurred = {
        input: successfulRuns.reduce((sum, run) => sum + run.costIncurred.input, 0),
        output: successfulRuns.reduce((sum, run) => sum + run.costIncurred.output, 0),
        total: successfulRuns.reduce((sum, run) => sum + run.costIncurred.total, 0)
      };
      
      // Calculate latency statistics
      const durations = successfulRuns.map(run => run.duration).sort((a, b) => a - b);
      const latency = {
        average: durations.reduce((sum, duration) => sum + duration, 0) / (durations.length || 1),
        min: durations[0] || 0,
        max: durations[durations.length - 1] || 0,
        p50: durations[Math.floor(durations.length * 0.5)] || 0,
        p90: durations[Math.floor(durations.length * 0.9)] || 0,
        p95: durations[Math.floor(durations.length * 0.95)] || 0
      };
      
      // Calculate accuracy metrics
      let totalTruePositives = 0;
      let totalFalsePositives = 0;
      let totalFalseNegatives = 0;
      
      for (const run of successfulRuns) {
        const expectedSet = new Set(run.testCase.expectedTags);
        const suggestedSet = new Set(run.suggestedTags);
        
        // True positives: tags that are both expected and suggested
        const truePositives = run.suggestedTags.filter(tag => expectedSet.has(tag)).length;
        
        // False positives: tags that are suggested but not expected
        const falsePositives = run.suggestedTags.filter(tag => !expectedSet.has(tag)).length;
        
        // False negatives: tags that are expected but not suggested
        const falseNegatives = run.testCase.expectedTags.filter(tag => !suggestedSet.has(tag)).length;
        
        totalTruePositives += truePositives;
        totalFalsePositives += falsePositives;
        totalFalseNegatives += falseNegatives;
      }
      
      // Calculate precision, recall, and F1 score
      const precision = totalTruePositives / (totalTruePositives + totalFalsePositives) || 0;
      const recall = totalTruePositives / (totalTruePositives + totalFalseNegatives) || 0;
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
      
      // Calculate overall accuracy
      const accuracy = successfulRuns.reduce((sum, run) => {
        const expectedSet = new Set(run.testCase.expectedTags);
        
        // Count matching tags
        const matchingTags = run.suggestedTags.filter(tag => expectedSet.has(tag)).length;
        
        // Total unique tags
        const totalUniqueTags = new Set([...run.testCase.expectedTags, ...run.suggestedTags]).size;
        
        // Return accuracy for this run
        return sum + (matchingTags / (totalUniqueTags || 1));
      }, 0) / (successfulRuns.length || 1);
      
      const modelDuration = Date.now() - modelStartTime;
      
      // Create model report
      const modelReport: ModelBenchmarkReport = {
        model,
        accuracy,
        precision,
        recall,
        f1Score,
        tokensUsed,
        costIncurred,
        latency,
        samples: successfulRuns.length,
        failedSamples: failedRuns.length,
        duration: modelDuration
      };
      
      modelReports.push(modelReport);
      
      // Log model summary
      logger.info(`\nModel ${chalk.cyan(model)} benchmark complete:`);
      logger.info(`  Accuracy: ${chalk.green((accuracy * 100).toFixed(2))}%`);
      logger.info(`  F1 Score: ${chalk.green((f1Score * 100).toFixed(2))}%`);
      logger.info(`  Tokens: ${chalk.cyan(tokensUsed.total.toLocaleString())}`);
      logger.info(`  Cost: ${chalk.yellow('$' + costIncurred.total.toFixed(4))}`);
      logger.info(`  Average Latency: ${chalk.cyan(latency.average.toFixed(2))}ms`);
      logger.info(`  Success Rate: ${chalk.green((successfulRuns.length / selectedTestCases.length * 100).toFixed(2))}%`);
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Find best model for each metric
    const bestAccuracy = modelReports.length > 0 ? modelReports.reduce((best, report) => 
      report.accuracy > best.accuracy ? report : best, modelReports[0]!) : undefined;
    
    const bestF1 = modelReports.length > 0 ? modelReports.reduce((best, report) => 
      report.f1Score > best.f1Score ? report : best, modelReports[0]!) : undefined;
    
    const bestCostEfficiency = modelReports.length > 0 ? modelReports.reduce((best, report) => {
      // Cost per correct tag
      const costPerCorrectTag = report.costIncurred.total / (report.accuracy * report.samples);
      const bestCostPerCorrectTag = best!.costIncurred.total / (best!.accuracy * best!.samples);
      return costPerCorrectTag < bestCostPerCorrectTag ? report : best;
    }, modelReports[0]!) : undefined;
    
    const bestLatency = modelReports.length > 0 ? modelReports.reduce((best, report) => 
      report.latency.average < best!.latency.average ? report : best, modelReports[0]!) : undefined;
    
    // Default model if no reports available
    const defaultModel = models[0] || 'gpt-3.5-turbo';
    
    // Create overall summary report
    const report: BenchmarkReport = {
      timestamp: new Date().toISOString(),
      models: modelReports,
      summary: {
        bestOverall: bestF1?.model || defaultModel,
        bestAccuracy: bestAccuracy?.model || defaultModel,
        bestCostEfficiency: bestCostEfficiency?.model || defaultModel,
        bestLatency: bestLatency?.model || defaultModel
      },
      settings: {
        samples: sampleSize,
        testSet: testSet || 'built-in'
      }
    };
    
    // Save report if requested
    if (saveReport) {
      const reportOutputPath = reportPath || 
        path.join(process.cwd(), `benchmark-report-${Date.now()}.json`);
      
      try {
        await fs.writeJson(reportOutputPath, report, { spaces: 2 });
        logger.info(`\nBenchmark report saved to: ${chalk.cyan(reportOutputPath)}`);
      } catch (error) {
        logger.error(`Failed to save benchmark report: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Log final summary
    logger.info(chalk.bold('\nBenchmark Summary:'));
    logger.info(`Total duration: ${chalk.cyan((totalDuration / 1000).toFixed(2))} seconds`);
    logger.info(`Models tested: ${chalk.cyan(models.length)}`);
    logger.info(`Samples per model: ${chalk.cyan(sampleSize)}`);
    logger.info(`Best overall model: ${chalk.green(report.summary.bestOverall)}`);
    logger.info(`Best accuracy: ${chalk.green(report.summary.bestAccuracy)}`);
    logger.info(`Best cost efficiency: ${chalk.green(report.summary.bestCostEfficiency)}`);
    logger.info(`Best latency: ${chalk.green(report.summary.bestLatency)}`);
    
    return Result.ok(report);
  }
  
  /**
   * Run a single test case
   */
  private async runTestCase(model: AIModel, testCase: TestCase): Promise<BenchmarkRunResult> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would call the tagging service
      // For this example, we'll simulate a response
      const tokensUsed = {
        input: costManager.estimateTokens(testCase.content),
        output: Math.floor(costManager.estimateTokens(testCase.content) * 0.2)
      };
      
      const costIncurred = costManager.estimateCost(model, {
        input: tokensUsed.input,
        output: tokensUsed.output
      });
      
      // Simulate network delay based on model
      const simulatedDelay = model === 'gpt-3.5-turbo' ? 1000 : 2000;
      await new Promise(resolve => setTimeout(resolve, simulatedDelay));
      
      // Simulate tag generation with some randomness
      const simulatedTags = this.simulateTagGeneration(model, testCase);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        model,
        testCase,
        suggestedTags: simulatedTags,
        tokensUsed: {
          ...tokensUsed,
          total: tokensUsed.input + tokensUsed.output
        },
        costIncurred,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        model,
        testCase,
        suggestedTags: [],
        tokensUsed: { input: 0, output: 0, total: 0 },
        costIncurred: { input: 0, output: 0, total: 0 },
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Simulate tag generation (for benchmarking purposes)
   */
  private simulateTagGeneration(model: AIModel, testCase: TestCase): string[] {
    // Simulate different accuracy levels for different models
    const accuracy = model === 'gpt-4o' ? 0.9 : 0.7; // Default to lower accuracy for non-gpt-4o models
    
    // Start with expected tags
    const resultTags: string[] = [];
    
    // Include expected tags based on accuracy
    testCase.expectedTags.forEach(tag => {
      if (Math.random() < accuracy) {
        resultTags.push(tag);
      }
    });
    
    // Add some random extra tags (false positives)
    const extraTagCount = Math.floor(Math.random() * 3);
    const possibleExtraTags = ['conversation', 'chat', 'openai', 'gpt', 'ai', 'notes', 'programming', 'tech', 'question', 'research'];
    
    for (let i = 0; i < extraTagCount; i++) {
      const randomIndex = Math.floor(Math.random() * possibleExtraTags.length);
      const randomTag = possibleExtraTags[randomIndex];
      if (randomTag && !resultTags.includes(randomTag)) {
        resultTags.push(randomTag);
      }
    }
    
    return resultTags;
  }
}

export const benchmark = Benchmark.getInstance(); 