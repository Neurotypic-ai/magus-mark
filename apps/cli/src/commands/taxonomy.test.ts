import fs from 'fs-extra';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@obsidian-magic/core';

import { config } from '../utils/config';
import { taxonomyCommand } from './taxonomy';

import type { Argv } from 'yargs';

// Mock dependencies
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    box: vi.fn(),
    configure: vi.fn(),
  },
}));

vi.mock('../../src/utils/config', () => ({
  config: {
    get: vi.fn((key: string) => {
      if (key === 'taxonomy') {
        return {
          categories: ['topic', 'technology', 'complexity'],
          tags: {
            topic: ['javascript', 'typescript', 'react', 'node'],
            technology: ['frontend', 'backend', 'database'],
            complexity: ['beginner', 'intermediate', 'advanced'],
          },
        };
      }
      return undefined;
    }),
    getAll: vi.fn().mockReturnValue({}),
  },
}));

vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(''),
    writeFileSync: vi.fn(),
    outputFileSync: vi.fn(),
  },
}));

describe('taxonomyCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct command name and description', () => {
    expect(taxonomyCommand.command).toBe('taxonomy');
    expect(typeof taxonomyCommand.describe).toBe('string');
  });

  it('should have the required options in builder', () => {
    const yargsInstance = {
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    const builderFn = taxonomyCommand.builder as (yargs: Argv) => Argv;
    expect(builderFn).toBeDefined();
    builderFn(yargsInstance);

    expect(yargsInstance.option).toHaveBeenCalledWith('output', expect.any(Object));
    expect(yargsInstance.option).toHaveBeenCalledWith('format', expect.any(Object));
  });

  it('should display taxonomy information', async () => {
    // Call the handler with mock arguments
    const handlerFn = taxonomyCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'pretty',
    });

    // Verify the logger was called
    expect(logger.info).toHaveBeenCalled();
    expect(config.get).toHaveBeenCalledWith('taxonomy');
  });

  it('should save taxonomy to file when output is specified', async () => {
    // Call the handler with output file specified
    const handlerFn = taxonomyCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'pretty',
      output: 'taxonomy.json',
    });

    // Verify file was written
    expect(fs.outputFileSync).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Saved taxonomy'));
  });

  it('should output JSON format when specified', async () => {
    // Call the handler with JSON format
    const handlerFn = taxonomyCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'json',
    });

    // Verify JSON output
    expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/^{/));
  });

  it('should handle empty taxonomy gracefully', async () => {
    // Override the mock to return undefined
    vi.mocked(config.get).mockReturnValueOnce(undefined);

    // Call the handler
    const handlerFn = taxonomyCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'pretty',
    });

    // Verify warning was shown
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No taxonomy'));
  });

  it('should handle malformed taxonomy gracefully', async () => {
    // Override the mock to return malformed data
    vi.mocked(config.get).mockReturnValueOnce({
      categories: null,
      tags: 'invalid',
    });

    // Call the handler
    const handlerFn = taxonomyCommand.handler;
    expect(handlerFn).toBeDefined();
    await handlerFn({
      format: 'pretty',
    });

    // Verify error handling
    expect(logger.warn).toHaveBeenCalled();
  });
});
