import path from 'path';

import fs from 'fs-extra';

import { AppError } from '@obsidian-magic/core/errors/AppError';
import { Result } from '@obsidian-magic/core/errors/Result';

import { OpenAIClient } from '../../../../packages/core/dist/src/openai/OpenAIClient';
import { TaggingService } from '../../../../packages/core/dist/src/openai/TaggingService';

import type { AIModel } from '@obsidian-magic/core';

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
class Chronometer {
  private static instance: Chronometer;
  private testCases: TestCase[] = [];

  /**
   * Get the singleton instance
   */
  public static getInstance(): Chronometer {
    return Chronometer.instance;
  }

  /**
   * Load test cases from file or directory
   */
  public loadTestCases(testSetPath: string): Result<TestCase[]> {
    try {
      // Mock implementation that returns sample test cases
      this.testCases = [
        {
          id: 'test-1',
          content: 'This is a sample conversation about TypeScript',
          expectedTags: ['typescript', 'programming'],
        },
        {
          id: 'test-2',
          content: 'This is a sample conversation about React',
          expectedTags: ['react', 'javascript', 'frontend'],
        },
        {
          id: 'test-3',
          content: `This is a sample conversation from ${testSetPath}`,
          expectedTags: ['node', 'javascript', 'backend'],
        },
      ];

      return Result.ok(this.testCases);
    } catch (error) {
      return Result.fail(new AppError(String(error), { code: 'TEST_CASE_LOAD_ERROR' }));
    }
  }

  /**
   * Run benchmark
   */
  public async runBenchmark(options: BenchmarkOptions): Promise<Result<BenchmarkReport>> {
    const { models, samples = 10, testSet, saveReport = false, reportPath } = options;

    try {
      // Load test cases if a test set is specified
      if (testSet) {
        const result = this.loadTestCases(testSet);
        if (result.isFail()) {
          return Result.fail(result.getError());
        }
      } else if (this.testCases.length === 0) {
        // Use default test cases if none are loaded
        this.testCases = [
          {
            id: 'default-1',
            content: 'This is a default test case about TypeScript',
            expectedTags: ['typescript', 'programming'],
          },
          {
            id: 'default-2',
            content: 'This is a default test case about React',
            expectedTags: ['react', 'frontend'],
          },
        ];
      }

      // Run benchmark for each model
      const modelReports: ModelBenchmarkReport[] = [];

      for (const model of models) {
        const modelReport = await this.benchmarkModel(model, samples);
        modelReports.push(modelReport);
      }

      // Determine the best models
      const bestAccuracyModel = this.findBestModel(modelReports, 'accuracy');
      const bestLatencyModel = this.findBestModel(modelReports, 'latency');
      const bestCostEfficiencyModel = this.findBestModel(modelReports, 'cost');
      const bestOverallModel = this.findBestOverallModel(modelReports);

      // Create the report
      const report: BenchmarkReport = {
        timestamp: new Date().toISOString(),
        models: modelReports,
        summary: {
          bestOverall: bestOverallModel,
          bestAccuracy: bestAccuracyModel,
          bestCostEfficiency: bestCostEfficiencyModel,
          bestLatency: bestLatencyModel,
        },
        settings: {
          samples,
          testSet: testSet ?? 'default',
        },
      };

      // Save the report if requested
      if (saveReport && reportPath) {
        const fullPath = path.isAbsolute(reportPath) ? reportPath : path.resolve(process.cwd(), reportPath);

        try {
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeJson(fullPath, report, { spaces: 2 });
        } catch (error) {
          console.error(`Failed to save report: ${String(error)}`);
        }
      }

      return Result.ok(report);
    } catch (error) {
      return Result.fail(new AppError(String(error), { code: 'BENCHMARK_ERROR' }));
    }
  }

  /**
   * Benchmark a single model
   */
  private async benchmarkModel(model: AIModel, samples: number): Promise<ModelBenchmarkReport> {
    const client = new OpenAIClient({
      apiKey: process.env['OPENAI_API_KEY'] ?? 'demo-api-key',
      model,
    });

    const taggingService = new TaggingService(client, {
      model,
      behavior: 'append',
      minConfidence: 0.7,
    });

    // Limit the number of test cases to the requested sample size
    const testCases = this.testCases.slice(0, samples);

    // Run the tests
    const results: BenchmarkRunResult[] = [];
    const startTime = Date.now();

    for (const testCase of testCases) {
      const result = await this.runTestCase(model, testCase, taggingService);
      results.push(result);
    }

    const duration = Date.now() - startTime;

    // Calculate metrics
    const successfulResults = results.filter((r) => r.success);
    const failedResults = results.filter((r) => !r.success);

    const totalTokensUsed = results.reduce((sum, r) => sum + r.tokensUsed.total, 0);
    const totalInputTokens = results.reduce((sum, r) => sum + r.tokensUsed.input, 0);
    const totalOutputTokens = results.reduce((sum, r) => sum + r.tokensUsed.output, 0);

    const totalCost = results.reduce((sum, r) => sum + r.costIncurred.total, 0);
    const inputCost = results.reduce((sum, r) => sum + r.costIncurred.input, 0);
    const outputCost = results.reduce((sum, r) => sum + r.costIncurred.output, 0);

    const latencies = successfulResults.map((r) => r.duration);
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / (latencies.length || 1);
    const minLatency = Math.min(...(latencies.length ? latencies : [0]));
    const maxLatency = Math.max(...(latencies.length ? latencies : [0]));

    // Sort latencies for percentiles
    latencies.sort((a, b) => a - b);
    const p50 = this.getPercentile(latencies, 50);
    const p90 = this.getPercentile(latencies, 90);
    const p95 = this.getPercentile(latencies, 95);

    // Calculate accuracy metrics
    let correctTags = 0;
    let totalTags = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const result of successfulResults) {
      const expected = result.testCase.expectedTags;
      const suggested = result.suggestedTags;

      totalTags += expected.length;

      for (const tag of expected) {
        if (suggested.includes(tag)) {
          correctTags++;
          truePositives++;
        } else {
          falseNegatives++;
        }
      }

      for (const tag of suggested) {
        if (!expected.includes(tag)) {
          falsePositives++;
        }
      }
    }

    const accuracy = totalTags > 0 ? correctTags / totalTags : 0;
    const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;

    return {
      model,
      accuracy,
      precision,
      recall,
      f1Score,
      tokensUsed: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalTokensUsed,
      },
      costIncurred: {
        input: inputCost,
        output: outputCost,
        total: totalCost,
      },
      latency: {
        average: avgLatency,
        min: minLatency,
        max: maxLatency,
        p50,
        p90,
        p95,
      },
      samples: testCases.length,
      failedSamples: failedResults.length,
      duration,
    };
  }

  /**
   * Run a single test case
   */
  private async runTestCase(
    model: AIModel,
    testCase: TestCase,
    taggingService: TaggingService
  ): Promise<BenchmarkRunResult> {
    try {
      const startTime = Date.now();

      // Call the tagging service
      const result = await taggingService.tagDocument({
        id: testCase.id,
        path: `${testCase.id}.md`,
        content: testCase.content,
        metadata: {},
      });

      const duration = Date.now() - startTime;

      if (!result.success) {
        return {
          success: false,
          model,
          testCase,
          suggestedTags: [],
          tokensUsed: { input: 0, output: 0, total: 0 },
          costIncurred: { input: 0, output: 0, total: 0 },
          duration,
          error: new Error(result.error?.message ?? 'Unknown error'),
        };
      }

      // Estimate token usage
      const inputTokens = Math.ceil(testCase.content.length / 4);
      const outputTokens = 50; // Approximate
      const totalTokens = inputTokens + outputTokens;

      // Estimate cost
      const inputCost = inputTokens * 0.000001; // $0.001 per 1K tokens
      const outputCost = outputTokens * 0.000002; // $0.002 per 1K tokens
      const totalCost = inputCost + outputCost;

      return {
        success: true,
        model,
        testCase,
        suggestedTags: result.tags ?? [],
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
        costIncurred: {
          input: inputCost,
          output: outputCost,
          total: totalCost,
        },
        duration,
      };
    } catch (error) {
      return {
        success: false,
        model,
        testCase,
        suggestedTags: [],
        tokensUsed: { input: 0, output: 0, total: 0 },
        costIncurred: { input: 0, output: 0, total: 0 },
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Get a percentile from a sorted array
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))] ?? 0;
  }

  /**
   * Find the best model based on a specific metric
   */
  private findBestModel(reports: ModelBenchmarkReport[], metric: 'accuracy' | 'latency' | 'cost'): AIModel {
    if (reports.length === 0) return 'gpt-3.5-turbo';

    if (metric === 'accuracy') {
      const sorted = [...reports].sort((a, b) => b.accuracy - a.accuracy);
      return sorted[0]?.model ?? 'gpt-3.5-turbo';
    } else if (metric === 'latency') {
      const sorted = [...reports].sort((a, b) => a.latency.average - b.latency.average);
      return sorted[0]?.model ?? 'gpt-3.5-turbo';
    } else {
      const sorted = [...reports].sort((a, b) => a.costIncurred.total - b.costIncurred.total);
      return sorted[0]?.model ?? 'gpt-3.5-turbo';
    }
  }

  /**
   * Find the best overall model using a weighted score
   */
  private findBestOverallModel(reports: ModelBenchmarkReport[]): AIModel {
    if (reports.length === 0) return 'gpt-3.5-turbo';

    // Normalize metrics
    const maxAccuracy = Math.max(...reports.map((r) => r.accuracy));
    const minLatency = Math.min(...reports.map((r) => r.latency.average));
    const minCost = Math.min(...reports.map((r) => r.costIncurred.total));

    // Calculate weighted scores (higher is better)
    const scores = reports.map((report) => {
      const accuracyScore = maxAccuracy > 0 ? report.accuracy / maxAccuracy : 1;
      const latencyScore = minLatency > 0 ? minLatency / report.latency.average : 1;
      const costScore = minCost > 0 ? minCost / report.costIncurred.total : 1;

      // Weight: 50% accuracy, 25% latency, 25% cost
      return {
        model: report.model,
        score: accuracyScore * 0.5 + latencyScore * 0.25 + costScore * 0.25,
      };
    });

    // Return the model with the highest score
    const sorted = scores.sort((a, b) => b.score - a.score);
    return sorted[0]?.model ?? 'gpt-3.5-turbo';
  }
}

// Export the benchmark singleton
export const benchmark = Chronometer.getInstance();
