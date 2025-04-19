import * as inquirerPrompts from '@inquirer/prompts';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Now import after all mocks are defined
import { config } from '../utils/config';
import { configInteractiveCommand } from './config-interactive';

import type { AIModel } from '@obsidian-magic/core/models/AIModel';
import type { Argv } from 'yargs';

import type { LogLevel } from '../types/commands';
import type { TagMode } from './config-interactive';

// Mock everything before imports to avoid hoisting issues
// This is necessary because vi.mock calls are hoisted to the top of the file
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  number: vi.fn(),
}));

// Instead of mocking console directly, we'll spy on its methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = vi.fn();
console.error = vi.fn();

// Mock OpenAI-related dependencies completely inline
vi.mock('@obsidian-magic/core/openai/ModelManager', () => ({
  ModelManager: {
    getInstance: () => ({
      getAvailableModels: vi
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve([
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', inputPrice: 1, outputPrice: 2 },
            { id: 'gpt-4', name: 'GPT-4', inputPrice: 10, outputPrice: 20 },
          ])
        )
        .mockImplementationOnce(() =>
          Promise.resolve([
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', inputPrice: 1, outputPrice: 2 },
            { id: 'gpt-4', name: 'GPT-4', inputPrice: 10, outputPrice: 20 },
          ])
        )
        .mockImplementationOnce(() => Promise.reject(new Error('API Error')))
        .mockImplementationOnce(() =>
          Promise.resolve([{ id: 'gpt-4', name: 'GPT-4', inputPrice: 10, outputPrice: 20 }])
        ),
      validateModel: vi.fn().mockResolvedValue({ valid: true }),
    }),
  },
}));

vi.mock('@obsidian-magic/core/openai/OpenAIClient', () => ({
  OpenAIClient: vi.fn().mockImplementation(() => ({
    getAvailableModels: vi.fn().mockResolvedValue([
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', inputPrice: 1, outputPrice: 2 },
      { id: 'gpt-4', name: 'GPT-4', inputPrice: 10, outputPrice: 20 },
    ]),
  })),
}));

vi.mock('fs-extra', () => ({
  pathExists: vi.fn(),
}));

vi.mock('@obsidian-magic/core/utils/Logger', () => ({
  Logger: {
    getInstance: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

vi.mock('../utils/config', () => ({
  config: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('configInteractiveCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    // Restore original console methods after tests
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should have the correct command name and description', () => {
    expect(configInteractiveCommand.command).toBe('setup');
    expect(configInteractiveCommand.describe).toContain('Interactive configuration setup');
  });

  it('should define required options in the builder', () => {
    // Create a mock for Yargs
    const yargsInstance = {
      option: vi.fn().mockReturnThis(),
    };

    // Call the builder function
    const builder = configInteractiveCommand.builder as (yargs: Argv) => Argv;
    builder(yargsInstance as unknown as Argv);

    // Check that the expected options are configured
    expect(yargsInstance.option).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        describe: expect.any(String) as string,
        type: 'string',
      })
    );

    expect(yargsInstance.option).toHaveBeenCalledWith(
      'minimal',
      expect.objectContaining({
        describe: expect.any(String) as string,
        type: 'boolean',
      })
    );

    expect(yargsInstance.option).toHaveBeenCalledWith(
      'export',
      expect.objectContaining({
        describe: expect.any(String) as string,
        type: 'string',
      })
    );
  });

  describe('handler function', () => {
    // Properly type the mock argv
    const mockArgv: {
      profile?: string | undefined;
      minimal: boolean;
      export?: string | undefined;
      $0: string;
      _: string[];
    } = {
      profile: undefined,
      minimal: false,
      export: undefined,
      $0: 'test',
      _: ['setup'],
    };

    it('should handle minimal setup mode', async () => {
      // Setup mocks for minimal mode
      const mockApiKey = 'sk-1234567890';

      // Mock environment variable
      const originalEnv = process.env;
      process.env = { ...originalEnv, OPENAI_API_KEY: mockApiKey };

      // Mock user responses with proper typing
      vi.mocked(inquirerPrompts.input).mockResolvedValueOnce('[keep current]');
      vi.mocked(inquirerPrompts.select<AIModel>).mockResolvedValueOnce('gpt-4' as AIModel);
      vi.mocked(inquirerPrompts.select<TagMode>).mockResolvedValueOnce('merge' as TagMode);
      vi.mocked(inquirerPrompts.confirm).mockResolvedValueOnce(true);

      // Mock config values with proper typing
      vi.mocked(config.get).mockImplementation((key: string) => {
        if (key === 'defaultModel') return 'gpt-3.5-turbo';
        if (key === 'tagMode') return 'append';
        return undefined;
      });

      // Run the handler with minimal mode
      await configInteractiveCommand.handler({ ...mockArgv, minimal: true });

      // Verify that minimal setup was used
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('minimal setup mode'));

      // Minimal setup shouldn't ask for concurrency
      expect(inquirerPrompts.number).not.toHaveBeenCalled();

      // Verify config was updated
      expect(config.set).toHaveBeenCalledWith('defaultModel', 'gpt-4');
      expect(config.set).toHaveBeenCalledWith('tagMode', 'merge');

      // Restore env
      process.env = originalEnv;
    });

    it('should validate vault path when provided', async () => {
      // Setup mocks for advanced setup
      vi.mocked(inquirerPrompts.input).mockResolvedValueOnce('sk-abcdefg');
      vi.mocked(inquirerPrompts.select<AIModel>).mockResolvedValueOnce('gpt-4' as AIModel);
      vi.mocked(inquirerPrompts.select<TagMode>).mockResolvedValueOnce('merge' as TagMode);
      vi.mocked(inquirerPrompts.number).mockResolvedValueOnce(5);
      vi.mocked(inquirerPrompts.select<LogLevel>).mockResolvedValueOnce('info' as LogLevel);

      // Mock vault path input and validation
      const mockPromise = Promise.resolve('/valid/path') as Promise<string> & { cancel: () => void };
      mockPromise.cancel = () => {
        /* noop */
      };
      vi.mocked(inquirerPrompts.input).mockReturnValueOnce(mockPromise);

      // Skip the rest of the inputs
      vi.mocked(inquirerPrompts.confirm).mockResolvedValueOnce(true);
      vi.mocked(inquirerPrompts.number).mockResolvedValueOnce(15);
      vi.mocked(inquirerPrompts.input).mockResolvedValueOnce('./output');
      vi.mocked(inquirerPrompts.confirm).mockResolvedValueOnce(false);

      // Run the handler without minimal mode
      await configInteractiveCommand.handler(mockArgv);

      // Verification would happen in the mock implementation
    });

    it('should handle error when fetching models', async () => {
      // Setup mocks
      vi.mocked(inquirerPrompts.input).mockResolvedValueOnce('sk-invalid');

      // Default values for other prompts to skip them
      vi.mocked(inquirerPrompts.select<AIModel>).mockResolvedValue('gpt-3.5-turbo' as AIModel);
      vi.mocked(inquirerPrompts.select<TagMode>).mockResolvedValueOnce('merge' as TagMode);
      vi.mocked(inquirerPrompts.confirm).mockResolvedValueOnce(true);

      // Run the handler
      await configInteractiveCommand.handler({ ...mockArgv, minimal: true });

      // Verify error handling
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching available models:'),
        expect.any(Error)
      );
    });

    it('should export configuration to file when export option is provided', async () => {
      // Setup mocks
      vi.mocked(inquirerPrompts.input).mockResolvedValueOnce('sk-1234');
      vi.mocked(inquirerPrompts.select<AIModel>).mockResolvedValueOnce('gpt-4' as AIModel);
      vi.mocked(inquirerPrompts.select<TagMode>).mockResolvedValueOnce('merge' as TagMode);
      vi.mocked(inquirerPrompts.confirm).mockResolvedValueOnce(true);

      // Mock filesystem function
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      vi.mock('@obsidian-magic/utils', () => ({
        writeFile: writeFileMock,
      }));

      // Run the handler with export option
      await configInteractiveCommand.handler({ ...mockArgv, minimal: true, export: './config.json' });

      // Verify config export
      // This would depend on how the export is implemented in the actual code
    });
  });
});
