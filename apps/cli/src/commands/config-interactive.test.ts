import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configInteractiveCommand } from './config-interactive';
import { logger } from '@obsidian-magic/logger';
import { config } from '../utils/config';
import type { Argv } from 'yargs';

// Mock dependencies
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    box: vi.fn(),
    configure: vi.fn()
  }
}));

vi.mock('../../src/utils/config', () => ({
  config: {
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn().mockReturnValue({
      apiKey: 'test-key',
      model: 'gpt-4o',
      outputFormat: 'pretty'
    })
  }
}));

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn().mockResolvedValue('test-api-key'),
  select: vi.fn().mockResolvedValue('gpt-4o'),
  confirm: vi.fn().mockResolvedValue(true)
}));

describe('configInteractiveCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct command name and description', () => {
    expect(configInteractiveCommand.command).toBe('setup');
    expect(typeof configInteractiveCommand.describe).toBe('string');
  });

  it('should have the required options in builder', () => {
    const yargsInstance = {
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis()
    } as unknown as Argv;
    
    const builderFn = configInteractiveCommand.builder as (yargs: Argv) => Argv;
    expect(builderFn).toBeDefined();
    builderFn(yargsInstance);
    
    // Verify options
    expect(yargsInstance.example).toHaveBeenCalled();
  });

  it('should guide user through interactive setup', async () => {
    const inquirerPrompts = await import('@inquirer/prompts');
    
    // Call the handler
    const mockArgs = { 
      _: ['setup'], 
      $0: 'obsidian-magic'
    };
    
    const handlerFn = configInteractiveCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn(mockArgs);
    
    // Verify prompts were shown
    expect(inquirerPrompts.input).toHaveBeenCalled();
    expect(inquirerPrompts.select).toHaveBeenCalled();
    
    // Verify config was updated
    expect(config.set).toHaveBeenCalled();
    
    // Verify success message
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Configuration complete'));
  });

  it('should handle errors during setup', async () => {
    const mockError = new Error('Prompt error');
    
    // Mock inquirer to throw an error
    vi.mocked(await import('@inquirer/prompts')).input.mockRejectedValueOnce(mockError);
    
    // Call the handler
    const mockArgs = { 
      _: ['setup'], 
      $0: 'obsidian-magic'
    };
    
    const handlerFn = configInteractiveCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn(mockArgs);
    
    // Verify error handling
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error'));
  });

  it('should show existing configuration values', async () => {
    const existingConfig = {
      apiKey: 'existing-key',
      model: 'gpt-3.5-turbo',
      outputFormat: 'json'
    };
    
    vi.mocked(config.getAll).mockReturnValueOnce(existingConfig);
    
    // Call the handler
    const mockArgs = { 
      _: ['setup'], 
      $0: 'obsidian-magic'
    };
    
    const handlerFn = configInteractiveCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn(mockArgs);
    
    // Verify current config was displayed
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Current configuration'));
  });

  it('should skip API key entry if environment variable is present', async () => {
    // Set environment variable
    process.env['OPENAI_API_KEY'] = 'env-api-key';
    
    // Call the handler
    const mockArgs = { 
      _: ['setup'], 
      $0: 'obsidian-magic'
    };
    
    const handlerFn = configInteractiveCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn(mockArgs);
    
    // Verify environment variable was detected
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Using API key from environment'));
    
    // Clean up
    delete process.env['OPENAI_API_KEY'];
  });
}); 