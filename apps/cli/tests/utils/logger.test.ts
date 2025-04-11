import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../../src/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('should have the expected methods', () => {
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.configure).toBeDefined();
    expect(logger.box).toBeDefined();
  });

  it('should configure logging level', () => {
    // Configure logger to show only errors
    logger.configure({ logLevel: 'error' });
    
    // Log messages at different levels
    logger.debug('Debug message');
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
    
    // In JSON mode, it should log a stringified object
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"message":"Test message"'));
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
}); 