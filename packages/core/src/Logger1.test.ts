import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from './Logger1';

describe('logger', () => {
  beforeEach(() => {
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(vi.fn());
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    vi.spyOn(console, 'info').mockImplementation(vi.fn());
    vi.spyOn(console, 'debug').mockImplementation(vi.fn());

    // Reset logger to default configuration between tests
    logger.configure({ logLevel: 'info', outputFormat: 'pretty' });
  });

  it('should have the expected methods', () => {
    // Bind methods to prevent unintentional this scoping
    const methods = {
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger),
      debug: logger.debug.bind(logger),
      configure: logger.configure.bind(logger),
      box: logger.box.bind(logger),
    };

    expect(methods.info).toBeDefined();
    expect(methods.warn).toBeDefined();
    expect(methods.error).toBeDefined();
    expect(methods.debug).toBeDefined();
    expect(methods.configure).toBeDefined();
    expect(methods.box).toBeDefined();
  });

  it('should configure logging level', () => {
    // Configure logger to show only errors
    logger.configure({ logLevel: 'error' });

    // Log messages at different levels
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    // Only error should be logged
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
  });

  it('should format messages correctly', () => {
    logger.configure({ logLevel: 'info', outputFormat: 'pretty' });

    logger.info('Test message');

    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Test message'));
  });

  it('should handle JSON output format', () => {
    logger.configure({ logLevel: 'info', outputFormat: 'json' });

    logger.info('Test message');

    // In JSON mode, it uses console.log instead of console.info
    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ level: 'info', message: 'Test message' }));
  });

  it('should not log in silent mode', () => {
    logger.configure({ logLevel: 'info', outputFormat: 'silent' });

    logger.info('Test message');
    logger.warn('Warning message');
    logger.error('Error message');

    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should format costs correctly', () => {
    const formatted = logger.formatCost(0.0123);
    expect(formatted).toBe('$0.0123');
  });

  it('should format tokens correctly', () => {
    const formatted = logger.formatTokens(1000000);
    expect(formatted).toBe('1,000,000');
  });
});
