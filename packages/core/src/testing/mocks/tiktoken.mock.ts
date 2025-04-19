import { vi } from 'vitest';

// Helper for returning typed mocks under isolatedDeclarations
type MockFactory<T> = () => T;

/**
 * Creates a mock for the tiktoken library
 */
export const mockTiktoken: MockFactory<{
  encoding_for_model: new () => {
    encode: (text: string) => number[];
    decode: (tokens: number[]) => string;
  };
}> = () => {
  return {
    encoding_for_model: vi.fn().mockImplementation(() => ({
      encode: vi.fn().mockReturnValue(Array(10).fill(0)),
      decode: vi.fn().mockReturnValue([]),
    })),
  };
};
