import type { AIModel } from '@obsidian-magic/types';

/**
 * Benchmark report for a single model
 */
export interface ModelBenchmarkReport {
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
export interface BenchmarkReport {
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
export interface BenchmarkOptions {
  models: AIModel[];
  samples?: number;
  testSet?: string;
  saveReport?: boolean;
  reportPath?: string;
}

/**
 * Test case for benchmarking
 */
export interface TestCase {
  id: string;
  content: string;
  expectedTags: string[];
}

/**
 * Benchmark run result
 */
export interface BenchmarkRunResult {
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