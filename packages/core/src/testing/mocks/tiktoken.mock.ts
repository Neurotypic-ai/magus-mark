import { vi } from 'vitest';

/**
 * Creates a mock for the tiktoken library
 */
export const mockTiktoken = () => {
  return {
    encoding_for_model: vi.fn().mockImplementation(() => ({
      encode: vi.fn().mockReturnValue(Array(10).fill(0)),
      decode: vi.fn().mockReturnValue([]),
    })),
  };
};
