import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { testCommand } from './test';
import { logger } from '@obsidian-magic/logger';
import type { ArgumentsCamelCase, Argv  } from 'yargs';

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
    getAll: vi.fn().mockReturnValue({})
  }
}));

vi.mock('@obsidian-magic/core', () => ({
  OpenAIClient: vi.fn().mockImplementation(() => ({
    tagDocument: vi.fn().mockResolvedValue({
      success: true, 
      result: {
        content: 'Test response',
        tokens: {
          prompt: 100,
          completion: 50,
          total: 150
        }
      }
    })
  }))
}));

describe('testCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['OPENAI_API_KEY'] = 'test-api-key';
  });

  afterEach(() => {
    delete process.env['OPENAI_API_KEY'];
  });

  it('should have the correct command name and description', () => {
    expect(testCommand.command).toBe('test');
    expect(typeof testCommand.describe).toBe('string');
  });

  it('should have the required options in builder', () => {
    const yargsInstance = {
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis()
    } as unknown as Argv;
    
    const builderFn = testCommand.builder as (yargs: Argv) => Argv;
    expect(builderFn).toBeDefined();
    builderFn(yargsInstance);
    
    expect(yargsInstance.option).toHaveBeenCalledWith('prompt', expect.any(Object));
    expect(yargsInstance.option).toHaveBeenCalledWith('model', expect.any(Object));
  });

  it('should call OpenAI with the specified prompt', async () => {
    // Prepare mock OpenAIClient
    const mockOpenAIClient = vi.fn().mockImplementation(() => ({
      test: vi.fn().mockResolvedValue({
        success: true,
        result: {
          content: 'Test response',
          tokens: {
            prompt: 100,
            completion: 50,
            total: 150
          }
        }
      })
    }));
    
    vi.doMock('@obsidian-magic/core', () => ({
      OpenAIClient: mockOpenAIClient
    }));
    
    // Call the handler with mock arguments
    const args = {
      prompt: 'Test prompt',
      model: 'gpt-4o',
      _: [],
      $0: 'obsidian-magic'
    } as unknown as ArgumentsCamelCase;
    
    const handlerFn = testCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn(args);
    
    // Verify OpenAIClient was instantiated
    expect(mockOpenAIClient).toHaveBeenCalled();
    
    // Verify logger was called with results
    expect(logger.info).toHaveBeenCalled();
    expect(logger.box).toHaveBeenCalled();
  });

  it('should handle errors from OpenAI API', async () => {
    // Mock the OpenAIClient to throw an error
    const errorMessage = 'API Error';
    const mockOpenAIClient = vi.fn().mockImplementation(() => ({
      test: vi.fn().mockRejectedValue(new Error(errorMessage))
    }));
    
    vi.doMock('@obsidian-magic/core', () => ({
      OpenAIClient: mockOpenAIClient
    }));
    
    // Call the handler
    const args = {
      prompt: 'Test prompt',
      model: 'gpt-4o',
      _: [],
      $0: 'obsidian-magic'
    } as unknown as ArgumentsCamelCase;
    
    const handlerFn = testCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn(args);
    
    // Verify error handling
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(errorMessage));
  });

  it('should display token usage information', async () => {
    // Mock successful OpenAI response
    const mockOpenAIClient = vi.fn().mockImplementation(() => ({
      test: vi.fn().mockResolvedValue({
        success: true,
        result: {
          content: 'Test response',
          tokens: {
            prompt: 100,
            completion: 50,
            total: 150
          }
        }
      })
    }));
    
    vi.doMock('@obsidian-magic/core', () => ({
      OpenAIClient: mockOpenAIClient
    }));
    
    // Call the handler
    const args = {
      prompt: 'Test prompt',
      model: 'gpt-4o',
      _: [],
      $0: 'obsidian-magic'
    } as unknown as ArgumentsCamelCase;
    
    const handlerFn = testCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn(args);
    
    // Verify token information was displayed
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('tokens'));
  });
}); 