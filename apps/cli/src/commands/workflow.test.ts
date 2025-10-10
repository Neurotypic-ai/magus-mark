import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { workflowCommand } from './workflow';

import type { Argv } from 'yargs';

vi.mock('@magus-mark/core/utils/Logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
  /* no-op */
});

describe('workflowCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has correct command and describe', () => {
    expect(workflowCommand.command).toBe('workflow <operation>');
    expect(workflowCommand.describe).toContain('workflow');
  });

  it('builder defines all options', () => {
    const yargsMock = {
      positional: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    const builder = workflowCommand.builder as (yargs: Argv) => Argv;
    builder(yargsMock);

    expect(yargsMock.option).toHaveBeenCalledWith('batch', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('parallel', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('preset', expect.any(Object));
  });

  it('handler routes to run operation', async () => {
    const argv = {
      operation: 'run',
      batch: true,
      parallel: 4,
      watch: false,
      dryRun: false,
      preset: 'balanced',
      output: undefined,
      pipeline: undefined,
      _: [],
      $0: 'test',
    };

    const handlerPromise = workflowCommand.handler(argv);
    await vi.runAllTimersAsync();
    await handlerPromise;

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Batch Processing'));
  });

  it('handler routes to create operation', async () => {
    const argv = {
      operation: 'create',
      batch: false,
      parallel: 4,
      watch: false,
      dryRun: false,
      preset: 'aggressive',
      output: undefined,
      pipeline: undefined,
      _: [],
      $0: 'test',
    };

    await workflowCommand.handler(argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Creating new workflow'));
  });

  it('handler routes to list operation', async () => {
    const argv = {
      operation: 'list',
      batch: false,
      parallel: 4,
      watch: false,
      dryRun: false,
      preset: 'balanced',
      output: undefined,
      pipeline: undefined,
      _: [],
      $0: 'test',
    };

    await workflowCommand.handler(argv);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available Workflow'));
  });

  it('handler routes to optimize with dry-run message', async () => {
    const argv = {
      operation: 'optimize',
      batch: false,
      parallel: 4,
      watch: false,
      dryRun: true,
      preset: 'balanced',
      output: undefined,
      pipeline: undefined,
      _: [],
      $0: 'test',
    };

    await workflowCommand.handler(argv);
    vi.runAllTimers();

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN'));
  });
});
