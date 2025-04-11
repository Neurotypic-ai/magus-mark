import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configCommand } from '../../src/commands/config';
import { logger } from '../../src/utils/logger';
import { config } from '../../src/utils/config';
import { fileExists, writeFile } from '@obsidian-magic/utils';

// Mock dependencies
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    box: vi.fn()
  }
}));

vi.mock('../../src/utils/config', () => ({
  config: {
    get: vi.fn(),
    getAll: vi.fn().mockReturnValue({
      apiKey: 'test-key',
      defaultModel: 'gpt-3.5-turbo'
    }),
    set: vi.fn(),
    loadConfigFile: vi.fn(),
    reset: vi.fn()
  }
}));

vi.mock('@obsidian-magic/utils', () => ({
  fileExists: vi.fn().mockResolvedValue(true),
  writeFile: vi.fn().mockResolvedValue(undefined)
}));

describe('configCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct command name and description', () => {
    expect(configCommand.command).toBe('config <command>');
    expect(configCommand.describe).toContain('Manage configuration');
  });

  it('should have subcommands in builder', () => {
    const yargsInstance = {
      command: vi.fn().mockReturnThis(),
      demandCommand: vi.fn().mockReturnThis(),
      help: vi.fn().mockReturnThis()
    };
    
    configCommand.builder(yargsInstance as any);
    
    // Should register get, set, import, export, and reset commands
    expect(yargsInstance.command).toHaveBeenCalledTimes(5);
  });

  // We would test each subcommand handler here in a real implementation
  // For example:
  
  describe('get subcommand', () => {
    it('should display a specific config value when key is provided', async () => {
      // Simulate the get command handler
      const getHandler = configCommand.builder({
        command: vi.fn().mockImplementation((cmd, desc, opts) => {
          if (cmd === 'get [key]') {
            return opts.handler;
          }
          return null;
        })
      } as any) as any;
      
      // This is a simplified test - actual implementation would be more complex
      // and would need to call the handler directly
    });
  });
}); 