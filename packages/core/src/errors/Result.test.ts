import { describe, expect, it } from 'vitest';

import { Result } from './Result';

describe('Result Pattern', () => {
  it('should create a successful result', () => {
    const result = Result.ok('success');
    expect(result.isOk()).toBe(true);
    expect(result.isFail()).toBe(false);
    expect(result.getValue()).toBe('success');
    expect(() => result.getError()).toThrow();
  });

  it('should create a failed result', () => {
    const error = new Error('Failed');
    const result = Result.fail(error);
    expect(result.isOk()).toBe(false);
    expect(result.isFail()).toBe(true);
    expect(() => result.getValue()).toThrow(error);
    expect(result.getError()).toBe(error);
  });

  it('should map successful result', () => {
    const result = Result.ok(5);
    const mapped = result.map((x) => x * 2);
    expect(mapped.isOk()).toBe(true);
    expect(mapped.getValue()).toBe(10);
  });

  it('should propagate error on map', () => {
    const error = new Error('Failed');
    const result = Result.fail<number>(error);
    const mapped = result.map((x) => x * 2);
    expect(mapped.isFail()).toBe(true);
    expect(mapped.getError()).toBe(error);
  });

  it('should handle errors in mapping function', () => {
    const result = Result.ok(5);
    const mapped = result.map(() => {
      throw new Error('Map failed');
    });
    expect(mapped.isFail()).toBe(true);
    expect(mapped.getError().message).toBe('Map failed');
  });

  it('should chain operations with andThen', () => {
    const result = Result.ok(5)
      .andThen((x) => Result.ok(x * 2))
      .andThen((x) => Result.ok(x + 1));

    expect(result.isOk()).toBe(true);
    expect(result.getValue()).toBe(11);
  });

  it('should short-circuit on failure with andThen', () => {
    const error = new Error('Failed');
    const result = Result.ok(5)
      .andThen(() => Result.fail(error))
      .andThen((x) => Result.ok((x as number) + 1));

    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBe(error);
  });

  it('should support getValueOrDefault', () => {
    const success = Result.ok(5);
    const failure = Result.fail(new Error('Failed'));

    expect(success.getValueOrDefault(10)).toBe(5);
    expect(failure.getValueOrDefault(10)).toBe(10);
  });

  it('should support mapError', () => {
    const error = new Error('Original error');
    const result = Result.fail<number>(error);

    const mapped = result.mapError((err) => new TypeError(`Mapped: ${err.message}`));

    expect(mapped.isFail()).toBe(true);
    expect(mapped.getError()).toBeInstanceOf(TypeError);
    expect(mapped.getError().message).toBe('Mapped: Original error');
  });
});
