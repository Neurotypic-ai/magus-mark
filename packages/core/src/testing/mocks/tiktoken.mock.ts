import { vi } from 'vitest';

// Helper for returning typed mocks under isolatedDeclarations
type MockFactory<T> = () => T;

/**
 * Creates a mock for the js-tiktoken/lite Tiktoken class
 */
export const mockTiktoken: MockFactory<{
  Tiktoken: new () => {
    encode: (text: string) => number[];
    decode: (tokens: number[]) => string;
  };
}> = () => {
  return {
    Tiktoken: vi.fn().mockImplementation(() => ({
      encode: vi.fn().mockReturnValue(Array(10).fill(0)),
      decode: vi.fn().mockReturnValue(''),
    })),
  };
};
