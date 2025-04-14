import { describe, it, expect } from 'vitest';
import type { Result } from './Result';

describe('Result', () => {
  it('handles success case', () => {
    const successResult: Result<string> = {
      success: true,
      value: 'success'
    };
    
    expect(successResult.success).toBe(true);
    expect(successResult.value).toBe('success');
  });
  
  it('handles error case', () => {
    const errorResult: Result<string> = {
      success: false,
      error: new Error('Something went wrong')
    };
    
    expect(errorResult.success).toBe(false);
    expect(errorResult.error.message).toBe('Something went wrong');
  });
  
  it('handles custom error types', () => {
    class CustomError extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    }
    
    const errorResult: Result<string, CustomError> = {
      success: false,
      error: new CustomError('Custom error', 'E123')
    };
    
    expect(errorResult.success).toBe(false);
    expect(errorResult.error.code).toBe('E123');
  });
}); 