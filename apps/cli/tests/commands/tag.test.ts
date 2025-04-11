import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tagCommand } from '../../src/commands/tag';
import { logger } from '../../src/utils/logger';
import { config } from '../../src/utils/config';
import * as fs from 'fs-extra';
import { OpenAIClient, TaggingService } from '@obsidian-magic/core';

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

vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('# Test Content\n\nThis is a test markdown file.'),
    writeFileSync: vi.fn()
  }
}));

vi.mock('@obsidian-magic/core', () => ({
  OpenAIClient: vi.fn().mockImplementation(() => ({
    setApiKey: vi.fn(),
    setModel: vi.fn()
  })),
  TaggingService: vi.fn().mockImplementation(() => ({
    tagDocument: vi.fn().mockResolvedValue({
      success: true,
      tags: ['test', 'markdown', 'content']
    })
  }))
}));

vi.mock('fs/promises', () => ({
  readdir: vi.fn().mockResolvedValue(['test.md']),
  stat: vi.fn().mockImplementation((path) => ({
    isFile: () => path.endsWith('.md'),
    isDirectory: () => !path.endsWith('.md')
  }))
}));

describe('tagCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('should have the correct command name and description', () => {
    expect(tagCommand.command).toBe('tag [paths..]');
    expect(tagCommand.describe).toContain('Process and tag conversations');
  });

  it('should have the required options in builder', () => {
    const yargsInstance = {
      positional: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis()
    };
    
    tagCommand.builder(yargsInstance as any);
    
    expect(yargsInstance.positional).toHaveBeenCalledWith('paths', expect.any(Object));
    expect(yargsInstance.option).toHaveBeenCalledWith('model', expect.any(Object));
    expect(yargsInstance.option).toHaveBeenCalledWith('mode', expect.any(Object));
    expect(yargsInstance.option).toHaveBeenCalledWith('dry-run', expect.any(Object));
  });

  // Additional tests would test the handler functionality
  // This would require more comprehensive mocking
}); 