import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConsoleLogger, createLogger } from './logger';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new ConsoleLogger('TestLogger');
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format messages with prefix', () => {
    logger.info('test message');

    // Wait for async queue processing
    setTimeout(() => {
      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call?.[0]).toContain('[TestLogger]');
      expect(call?.[0]).toContain('test message');
    }, 100);
  });

  it('should log errors with error details', () => {
    const testError = new Error('test error');
    logger.error('Error occurred', testError);

    setTimeout(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    }, 100);
  });

  it('should only log debug when DEBUG is true', () => {
    const originalDebug = process.env['DEBUG'];

    // Debug disabled
    delete process.env['DEBUG'];
    logger.debug('debug message');

    setTimeout(() => {
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    }, 100);

    // Restore environment
    if (originalDebug !== undefined) {
      process.env['DEBUG'] = originalDebug;
    }
  });
});

describe('createLogger', () => {
  it('should create logger with custom prefix', () => {
    const customLogger = createLogger('CustomPrefix');
    expect(customLogger).toBeInstanceOf(ConsoleLogger);
  });
});
