import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analyzeCommand } from './analyze';

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

describe('analyzeCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has correct command and describe', () => {
    expect(analyzeCommand.command).toBe('analyze [paths..]');
    expect(analyzeCommand.describe).toContain('analysis');
  });

  it('builder defines all required options', () => {
    const yargsMock = {
      positional: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    const builder = analyzeCommand.builder as (yargs: Argv) => Argv;
    builder(yargsMock);

    expect(yargsMock.option).toHaveBeenCalledWith('deep', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('sentiment', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('trends', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('predict', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('ai', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('format', expect.any(Object));
  });

  it('handler runs analysis with format=report and displays results', async () => {
    const argv = {
      paths: ['.'],
      deep: false,
      pattern: undefined,
      format: 'report',
      predict: false,
      compare: undefined,
      sentiment: false,
      trends: false,
      ai: true,
      _: [],
      $0: 'test',
    };

    const handlerPromise = analyzeCommand.handler(argv);
    await vi.runAllTimersAsync();
    await handlerPromise;

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ANALYSIS'));
  });

  it('handler runs analysis with format=json', async () => {
    const argv = {
      paths: ['.'],
      deep: false,
      pattern: undefined,
      format: 'json',
      predict: false,
      compare: undefined,
      sentiment: false,
      trends: false,
      ai: false,
      _: [],
      $0: 'test',
    };

    const handlerPromise = analyzeCommand.handler(argv);
    await vi.runAllTimersAsync();
    await handlerPromise;

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('JSON OUTPUT'));
  });

  it('handler includes advanced sections when flags set', async () => {
    const argv = {
      paths: ['.'],
      deep: true,
      pattern: undefined,
      format: 'report',
      predict: true,
      compare: undefined,
      sentiment: true,
      trends: true,
      ai: true,
      _: [],
      $0: 'test',
    };

    const handlerPromise = analyzeCommand.handler(argv);
    await vi.runAllTimersAsync();
    await handlerPromise;

    const allCalls = consoleLogSpy.mock.calls.map((c) => c.join(' '));
    expect(allCalls.some((c) => c.includes('Sentiment'))).toBe(true);
    expect(allCalls.some((c) => c.includes('Trend'))).toBe(true);
    expect(allCalls.some((c) => c.includes('Predictions'))).toBe(true);
    expect(allCalls.some((c) => c.includes('Deep Learning'))).toBe(true);
  });
});
