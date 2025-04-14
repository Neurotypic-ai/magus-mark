import { describe, expect, it } from 'vitest';

import { CostLimitError } from './CostLimitError';

describe('CostLimitError', () => {
  it('should create error with default values', () => {
    const error = new CostLimitError('Cost limit exceeded', { cost: 100, limit: 50 });
    expect(error.message).toBe('Cost limit exceeded');
    expect(error.code).toBe('COST_LIMIT_ERROR');
    expect(error.recoverable).toBe(false);
  });

  it('should create error with custom code', () => {
    const error = new CostLimitError('Cost limit exceeded', {
      code: 'BUDGET_EXCEEDED',
      cost: 200,
      limit: 100,
    });
    expect(error.message).toBe('Cost limit exceeded');
    expect(error.code).toBe('BUDGET_EXCEEDED');
  });

  it('should create error with custom recoverable flag', () => {
    const error = new CostLimitError('Cost limit exceeded', {
      recoverable: true,
      cost: 150,
      limit: 100,
    });
    expect(error.message).toBe('Cost limit exceeded');
    expect(error.recoverable).toBe(true);
  });

  it('should include cost and limit in context', () => {
    const error = new CostLimitError('Cost limit exceeded', {
      cost: 300,
      limit: 200,
    });
    expect(error.context).toEqual({
      cost: 300,
      limit: 200,
    });
  });
});
