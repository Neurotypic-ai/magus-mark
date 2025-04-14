import { describe, expect, it } from 'vitest';

import type { AsyncState, AsyncStatus } from './AsyncState';

describe('AsyncStatus and AsyncState', () => {
  it('validates async status values', () => {
    const idle: AsyncStatus = 'idle';
    const loading: AsyncStatus = 'loading';
    const success: AsyncStatus = 'success';
    const error: AsyncStatus = 'error';

    expect(idle).toBe('idle');
    expect(loading).toBe('loading');
    expect(success).toBe('success');
    expect(error).toBe('error');
  });

  it('handles idle state', () => {
    const state: AsyncState<string> = {
      status: 'idle',
    };

    expect(state.status).toBe('idle');
    expect(state.data).toBeUndefined();
    expect(state.error).toBeUndefined();
  });

  it('handles loading state', () => {
    const state: AsyncState<string> = {
      status: 'loading',
    };

    expect(state.status).toBe('loading');
  });

  it('handles success state', () => {
    const state: AsyncState<string> = {
      status: 'success',
      data: 'test data',
    };

    expect(state.status).toBe('success');
    expect(state.data).toBe('test data');
  });

  it('handles error state', () => {
    const state: AsyncState<string> = {
      status: 'error',
      error: new Error('Failed to fetch data'),
    };

    expect(state.status).toBe('error');
    expect(state.error?.message).toBe('Failed to fetch data');
  });

  it('handles custom error types', () => {
    interface APIError {
      statusCode: number;
      message: string;
    }

    const state: AsyncState<string, APIError> = {
      status: 'error',
      error: {
        statusCode: 404,
        message: 'Resource not found',
      },
    };

    expect(state.status).toBe('error');
    if (state.error) {
      expect(state.error.statusCode).toBe(404);
    }
  });
});
