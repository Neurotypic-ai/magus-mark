/**
 * CLI-specific type definitions for Obsidian Magic
 */

import type { APIConfig, Document, TaggingOptions } from '@obsidian-magic/core';

/**
 * CLI command context
 */
export interface CommandContext {
  workingDirectory: string;
  configPath: string;
  config: CLIConfig;
  verbose: boolean;
  quiet: boolean;
  dryRun: boolean;
}

/**
 * CLI configuration
 */
export interface CLIConfig {
  api: APIConfig;
  tagging: TaggingOptions;
  paths: {
    vaultRoot: string;
    outputDirectory: string;
    excludePatterns: string[];
    includePatterns: string[];
  };
  batch: {
    maxConcurrency: number;
    batchSize: number;
    rateLimit: number; // requests per minute
  };
  output: {
    format: 'json' | 'yaml' | 'table' | 'csv';
    colorize: boolean;
    showProgress: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * CLI command definition
 */
export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  examples?: string[];
  options: CommandOption[];
  handler: (context: CommandContext, args: Record<string, unknown>) => Promise<void>;
}

/**
 * CLI command option
 */
export interface CommandOption {
  name: string;
  alias?: string;
  description: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  default?: unknown;
  required?: boolean;
  choices?: string[];
}

/**
 * CLI progress data
 */
export interface ProgressData {
  total: number;
  current: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  error?: Error;
}

/**
 * CLI progress callback
 */
export type ProgressCallback = (data: ProgressData) => void;

/**
 * CLI logging function
 */
export type LogFunction = (message: string, level: 'debug' | 'info' | 'warn' | 'error') => void;

/**
 * CLI execution result
 */
export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: Error;
  exitCode: number;
}

/**
 * CLI job definition
 */
export interface JobDefinition {
  id: string;
  name: string;
  documents: Document[];
  options: TaggingOptions;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: ProgressData;
  onProgress?: ProgressCallback;
}
