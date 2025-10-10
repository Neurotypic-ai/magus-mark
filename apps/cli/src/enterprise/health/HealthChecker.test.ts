import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthChecker } from './HealthChecker';

import type { HealthCheck } from './HealthChecker';

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

vi.mock('@magus-mark/core/openai/OpenAIClient');
vi.mock('node:fs/promises');

describe('HealthChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds and removes checks', () => {
    const checker = new HealthChecker();
    const customCheck: HealthCheck = {
      name: 'custom',
      description: 'Custom check',
      critical: false,
      timeout: 1000,
      check: vi.fn().mockResolvedValue({ healthy: true, message: 'OK', duration: 50 }),
    };

    checker.addCheck(customCheck);
    expect(checker.getCheckNames()).toContain('custom');

    checker.removeCheck('custom');
    expect(checker.getCheckNames()).not.toContain('custom');
  });

  it('runs single check and returns result with metadata', async () => {
    const checker = new HealthChecker();
    const customCheck: HealthCheck = {
      name: 'test-check',
      description: 'Test',
      critical: true,
      timeout: 5000,
      check: vi.fn().mockResolvedValue({
        healthy: true,
        message: 'All good',
        duration: 100,
        metadata: { foo: 'bar' },
      }),
    };

    checker.addCheck(customCheck);
    const result = await checker.runCheck('test-check');

    expect(result.healthy).toBe(true);
    expect(result.message).toBe('All good');
    expect(result.metadata).toEqual({ foo: 'bar' });
  });

  it('enforces timeout on slow checks', async () => {
    const checker = new HealthChecker();
    const slowCheck: HealthCheck = {
      name: 'slow',
      description: 'Slow check',
      critical: false,
      timeout: 100,
      check: () =>
        new Promise((resolve) => {
          const timer = setTimeout(() => {
            resolve({
              healthy: true,
              message: 'OK',
              duration: 200,
            });
          }, 200);
          timer.unref();
        }),
    };

    checker.addCheck(slowCheck);

    vi.useRealTimers();
    const result = await checker.runCheck('slow');
    vi.useFakeTimers();

    expect(result.healthy).toBe(false);
    expect(result.message).toContain('timeout');
  });

  it('runAllChecks computes overall health status', async () => {
    const checker = new HealthChecker();

    const passingCheck: HealthCheck = {
      name: 'passing',
      description: 'Passing',
      critical: false,
      timeout: 1000,
      check: vi.fn().mockResolvedValue({ healthy: true, message: 'OK', duration: 10 }),
    };

    const failingNonCritical: HealthCheck = {
      name: 'failing',
      description: 'Failing',
      critical: false,
      timeout: 1000,
      check: vi.fn().mockResolvedValue({ healthy: false, message: 'Failed', duration: 10 }),
    };

    // Remove default checks
    const defaultChecks = checker.getCheckNames();
    defaultChecks.forEach((name) => {
      checker.removeCheck(name);
    });

    checker.addCheck(passingCheck);
    checker.addCheck(failingNonCritical);

    let health = await checker.runAllChecks();
    expect(health.overall).toBe('degraded');
    expect(health.summary.passed).toBe(1);
    expect(health.summary.failed).toBe(1);

    const criticalFailing: HealthCheck = {
      name: 'critical-fail',
      description: 'Critical',
      critical: true,
      timeout: 1000,
      check: vi.fn().mockResolvedValue({ healthy: false, message: 'Critical fail', duration: 10 }),
    };

    checker.addCheck(criticalFailing);
    health = await checker.runAllChecks();
    expect(health.overall).toBe('unhealthy');
    expect(health.summary.critical).toBe(1);
  });

  it('stores lastResults after running checks', async () => {
    const checker = new HealthChecker();
    const check: HealthCheck = {
      name: 'test',
      description: 'Test',
      critical: false,
      timeout: 1000,
      check: vi.fn().mockResolvedValue({ healthy: true, message: 'OK', duration: 10 }),
    };

    checker.addCheck(check);
    await checker.runCheck('test');

    const lastResults = checker.getLastResults();
    expect(lastResults['test']).toBeDefined();
    expect(lastResults['test']?.healthy).toBe(true);
  });
});
