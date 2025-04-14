import { describe, expect, it } from 'vitest';

import { FileSystemError } from './FileSystemError';

describe('FileSystemError', () => {
  it('should create error with default values', () => {
    const error = new FileSystemError('File not found');
    expect(error.message).toBe('File not found');
    expect(error.code).toBe('FILE_SYSTEM_ERROR');
    expect(error.recoverable).toBe(false);
    expect(error.path).toBeUndefined();
  });

  it('should create error with custom path', () => {
    const error = new FileSystemError('File not found', { path: '/test/file.txt' });
    expect(error.message).toBe('File not found');
    expect(error.code).toBe('FILE_SYSTEM_ERROR');
    expect(error.path).toBe('/test/file.txt');
  });

  it('should create error with custom code', () => {
    const error = new FileSystemError('File not found', { code: 'FILE_NOT_FOUND' });
    expect(error.message).toBe('File not found');
    expect(error.code).toBe('FILE_NOT_FOUND');
  });
});
