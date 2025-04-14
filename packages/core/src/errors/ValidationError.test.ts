import { describe, expect, it } from 'vitest';

import { AppError } from './AppError';
import { ValidationError } from './ValidationError';

describe('ValidationError', () => {
  it('should create ValidationError with correct properties', () => {
    const validationErrors = { name: ['is required'] };
    const error = new ValidationError('Validation failed', {
      validationErrors,
      field: 'name',
    });
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.validationErrors).toBe(validationErrors);
    expect(error.field).toBe('name');
    expect(error.recoverable).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('should allow custom error code', () => {
    const error = new ValidationError('Schema validation failed', {
      code: 'SCHEMA_VALIDATION_ERROR',
    });
    expect(error.message).toBe('Schema validation failed');
    expect(error.code).toBe('SCHEMA_VALIDATION_ERROR');
  });

  it('should preserve context in formatted error', () => {
    const error = new ValidationError('Validation failed', {
      field: 'email',
      validationErrors: { email: ['is invalid', 'is required'] },
      context: { requestId: '123' },
    });

    const formatted = error.format();
    expect(formatted).toContain('Validation failed');
    expect(formatted).toContain('VALIDATION_ERROR');
    expect(formatted).toContain('requestId');
    expect(formatted).toContain('123');
  });
});
