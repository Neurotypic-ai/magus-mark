import { afterEach, beforeEach, expect, vi } from 'vitest';

let errorSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error');
  warnSpy = vi.spyOn(console, 'warn');
});

afterEach(() => {
  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});
