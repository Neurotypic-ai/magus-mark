import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { healthCommand } from './health';

import type { Argv } from 'yargs';

const mockHealthChecker = {
  runAllChecks: vi.fn().mockResolvedValue({
    overall: 'healthy',
    timestamp: new Date(),
    summary: { total: 4, passed: 4, failed: 0, critical: 0 },
    checks: {
      'openai-api': { healthy: true, message: 'OK', duration: 100 },
      configuration: { healthy: true, message: 'Valid', duration: 50 },
      filesystem: { healthy: true, message: 'OK', duration: 20 },
      memory: { healthy: true, message: 'Normal', duration: 10 },
    },
  }),
  runCheck: vi.fn().mockResolvedValue({
    healthy: true,
    message: 'Check passed',
    duration: 100,
  }),
};

vi.mock('../enterprise/health/HealthChecker', () => ({
  HealthChecker: vi.fn(() => mockHealthChecker),
}));

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

describe('healthCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has correct command and describe', () => {
    expect(healthCommand.command).toBe('health [check]');
    expect(healthCommand.describe).toContain('health');
  });

  it('builder defines all options', () => {
    const yargsMock = {
      positional: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      example: vi.fn().mockReturnThis(),
    } as unknown as Argv;

    const builder = healthCommand.builder as (yargs: Argv) => Argv;
    builder(yargsMock);

    expect(yargsMock.option).toHaveBeenCalledWith('format', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('watch', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('interval', expect.any(Object));
    expect(yargsMock.option).toHaveBeenCalledWith('fix', expect.any(Object));
  });

  it('runs all checks and displays table format', async () => {
    const argv = {
      check: undefined,
      format: 'table',
      watch: false,
      interval: 30,
      fix: false,
      _: [],
      $0: 'test',
    };

    await healthCommand.handler(argv);

    expect(mockHealthChecker.runAllChecks).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Health Status'));
  });

  it('runs single check when check arg provided', async () => {
    const argv = {
      check: 'openai-api',
      format: 'table',
      watch: false,
      interval: 30,
      fix: false,
      _: [],
      $0: 'test',
    };

    await healthCommand.handler(argv);

    expect(mockHealthChecker.runCheck).toHaveBeenCalledWith('openai-api');
  });

  it('outputs JSON format when requested', async () => {
    const argv = {
      check: undefined,
      format: 'json',
      watch: false,
      interval: 30,
      fix: false,
      _: [],
      $0: 'test',
    };

    await healthCommand.handler(argv);

    const jsonCalls = consoleLogSpy.mock.calls.filter((c) => {
      const str = c.join(' ');
      return str.startsWith('{') || str.includes('"overall"');
    });
    expect(jsonCalls.length).toBeGreaterThan(0);
  });
});
