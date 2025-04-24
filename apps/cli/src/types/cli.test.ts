import { describe, expect, it, vi } from 'vitest';

import type {
  CLIConfig,
  CommandContext,
  CommandDefinition,
  CommandOption,
  ExecutionResult,
  JobDefinition,
  LogFunction,
  ProgressCallback,
  ProgressData,
} from './cli';

describe('CLI Models', () => {
  describe('CommandContext', () => {
    it('validates a command context object', () => {
      const context: CommandContext = {
        workingDirectory: '/home/user/obsidian',
        configPath: '/home/user/.config/magus-mark.json',
        config: {
          api: {
            apiKey: 'test-api-key',
            apiKeyStorage: 'local',
            defaultModel: 'gpt-4o',
            timeoutMs: 30000,
            maxRetries: 3,
            costPerTokenMap: {
              'gpt-4o': 0.0001,
            },
          },
          tagging: {
            model: 'gpt-4o',
            behavior: 'append',
            minConfidence: 0.6,
            reviewThreshold: 0.8,
            generateExplanations: true,
          },
          paths: {
            vaultRoot: '/home/user/obsidian',
            outputDirectory: '/home/user/obsidian/tags',
            excludePatterns: ['*.tmp', '*.log'],
            includePatterns: ['*.md'],
          },
          batch: {
            maxConcurrency: 4,
            batchSize: 10,
            rateLimit: 60,
          },
          output: {
            format: 'json',
            colorize: true,
            showProgress: true,
            logLevel: 'info',
          },
        },
        verbose: true,
        quiet: false,
        dryRun: false,
      };

      // Type checking verification
      expect(context.workingDirectory).toBe('/home/user/obsidian');
      expect(context.config.api.defaultModel).toBe('gpt-4o');
      expect(context.config.paths.includePatterns).toContain('*.md');
      expect(context.config.output.format).toBe('json');
      expect(context.verbose).toBe(true);
    });
  });

  describe('CLIConfig', () => {
    it('validates a cli config object', () => {
      const config: CLIConfig = {
        api: {
          apiKey: 'test-api-key',
          apiKeyStorage: 'local',
          defaultModel: 'gpt-4o',
          timeoutMs: 30000,
          maxRetries: 3,
          costPerTokenMap: {
            'gpt-4o': 0.0001,
          },
        },
        tagging: {
          model: 'gpt-4o',
          behavior: 'append',
          minConfidence: 0.6,
          reviewThreshold: 0.8,
          generateExplanations: true,
        },
        paths: {
          vaultRoot: '/home/user/obsidian',
          outputDirectory: '/home/user/obsidian/tags',
          excludePatterns: ['*.tmp', '*.log'],
          includePatterns: ['*.md'],
        },
        batch: {
          maxConcurrency: 4,
          batchSize: 10,
          rateLimit: 60,
        },
        output: {
          format: 'json',
          colorize: true,
          showProgress: true,
          logLevel: 'info',
        },
      };

      // Type checking verification
      expect(config.api.apiKey).toBe('test-api-key');
      expect(config.tagging.model).toBe('gpt-4o');
      expect(config.paths.vaultRoot).toBe('/home/user/obsidian');
      expect(config.batch.maxConcurrency).toBe(4);
      expect(config.output.format).toBe('json');

      // Verify that format only accepts allowed values
      type OutputFormat = typeof config.output.format;
      const formats: OutputFormat[] = ['json', 'yaml', 'table', 'csv'];
      expect(formats).toContain(config.output.format);

      // Verify that logLevel only accepts allowed values
      type LogLevel = typeof config.output.logLevel;
      const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
      expect(logLevels).toContain(config.output.logLevel);
    });
  });

  describe('CommandDefinition', () => {
    it('validates a command definition object', () => {
      // Mock handler function
      const handler = vi.fn();

      const command: CommandDefinition = {
        name: 'tag',
        description: 'Tag notes with AI-generated tags',
        aliases: ['t', 'auto-tag'],
        examples: ['magus-mark tag --path ./notes', 'magus-mark tag --model gpt-4o'],
        options: [
          {
            name: 'path',
            alias: 'p',
            description: 'Path to notes directory',
            type: 'string',
            default: '.',
            required: false,
          },
          {
            name: 'model',
            description: 'AI model to use',
            type: 'string',
            choices: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
            default: 'gpt-4o',
          },
        ],
        handler: handler,
      };

      // Type checking verification
      expect(command.name).toBe('tag');
      expect(command.aliases).toContain('t');
      expect(command.options).toHaveLength(2);
      expect(command.options[0]?.name).toBe('path');
      if (command.options[1]?.choices) {
        expect(command.options[1].choices).toContain('gpt-4o');
      }

      // Verify handler can be called
      void command.handler(
        {
          workingDirectory: '.',
          configPath: './config.json',
          config: {} as CLIConfig,
          verbose: false,
          quiet: false,
          dryRun: false,
        },
        { path: './notes' }
      );

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('CommandOption', () => {
    it('validates different types of command options', () => {
      // String option
      const stringOption: CommandOption = {
        name: 'output',
        alias: 'o',
        description: 'Output file path',
        type: 'string',
        default: 'output.json',
      };

      // Boolean option
      const boolOption: CommandOption = {
        name: 'verbose',
        alias: 'v',
        description: 'Enable verbose output',
        type: 'boolean',
        default: false,
      };

      // Number option
      const numberOption: CommandOption = {
        name: 'concurrent',
        alias: 'c',
        description: 'Number of concurrent operations',
        type: 'number',
        default: 4,
      };

      // Array option
      const arrayOption: CommandOption = {
        name: 'include',
        alias: 'i',
        description: 'File patterns to include',
        type: 'array',
        default: ['*.md'],
      };

      // Option with choices
      const choiceOption: CommandOption = {
        name: 'format',
        description: 'Output format',
        type: 'string',
        choices: ['json', 'yaml', 'markdown'],
        default: 'json',
      };

      // Type checking verification
      expect(stringOption.type).toBe('string');
      expect(boolOption.type).toBe('boolean');
      expect(numberOption.type).toBe('number');
      expect(arrayOption.type).toBe('array');
      if (choiceOption.choices) {
        expect(choiceOption.choices).toContain('json');
      }
    });
  });

  describe('Progress Data and Callbacks', () => {
    it('validates progress data object', () => {
      const progressData: ProgressData = {
        total: 100,
        current: 25,
        status: 'processing',
        message: 'Processing file 25 of 100',
      };

      // Type checking verification
      expect(progressData.total).toBe(100);
      expect(progressData.current).toBe(25);
      expect(progressData.status).toBe('processing');

      // Status should be one of the allowed values
      const validStatuses: ProgressData['status'][] = ['pending', 'processing', 'completed', 'failed'];
      expect(validStatuses).toContain(progressData.status);
    });

    it('validates progress callback behavior', () => {
      const progressCallback: ProgressCallback = vi.fn();

      const progressData: ProgressData = {
        total: 50,
        current: 10,
        status: 'processing',
      };

      // Call the callback
      progressCallback(progressData);

      // Verify callback was called with correct data
      expect(progressCallback).toHaveBeenCalledWith(progressData);
    });
  });

  describe('Logging Function', () => {
    it('validates log function behavior', () => {
      const logFn: LogFunction = vi.fn();

      // Call with different log levels
      logFn('Debug message', 'debug');
      logFn('Info message', 'info');
      logFn('Warning message', 'warn');
      logFn('Error message', 'error');

      // Verify function was called with correct parameters
      expect(logFn).toHaveBeenCalledTimes(4);
      expect(logFn).toHaveBeenCalledWith('Debug message', 'debug');
      expect(logFn).toHaveBeenCalledWith('Error message', 'error');
    });
  });

  describe('Execution Result', () => {
    it('validates successful execution result', () => {
      const result: ExecutionResult = {
        success: true,
        message: 'Operation completed successfully',
        data: { processed: 42, tagged: 38 },
        exitCode: 0,
      };

      // Type checking verification
      expect(result.success).toBe(true);
      expect(result.message).toBe('Operation completed successfully');
      expect(result.data).toEqual({ processed: 42, tagged: 38 });
      expect(result.exitCode).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('validates failed execution result', () => {
      const error = new Error('Operation failed');

      const result: ExecutionResult = {
        success: false,
        message: 'Operation failed due to an error',
        error,
        exitCode: 1,
      };

      // Type checking verification
      expect(result.success).toBe(false);
      expect(result.message).toBe('Operation failed due to an error');
      expect(result.error).toBe(error);
      expect(result.exitCode).toBe(1);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Job Definition', () => {
    it('validates job definition object', () => {
      const now = new Date();

      const job: JobDefinition = {
        id: 'job-123',
        name: 'Tag Batch 1',
        documents: [
          {
            id: 'doc-1',
            path: '/notes/file1.md',
            content: 'Note content 1',
            metadata: {},
          },
          {
            id: 'doc-2',
            path: '/notes/file2.md',
            content: 'Note content 2',
            metadata: {},
          },
        ],
        options: {
          model: 'gpt-4o',
          behavior: 'append',
          minConfidence: 0.6,
          reviewThreshold: 0.8,
          generateExplanations: true,
        },
        startTime: now,
        status: 'processing',
        progress: {
          total: 2,
          current: 1,
          status: 'processing',
        },
        onProgress: vi.fn(),
      };

      // Type checking verification
      expect(job.id).toBe('job-123');
      expect(job.documents).toHaveLength(2);
      expect(job.options.model).toBe('gpt-4o');
      expect(job.startTime).toBe(now);
      expect(job.status).toBe('processing');
      expect(job.progress.current).toBe(1);

      // Test callback if present
      if (job.onProgress) {
        job.onProgress({
          total: 2,
          current: 2,
          status: 'completed',
        });

        expect(job.onProgress).toHaveBeenCalled();
      }
    });
  });
});
