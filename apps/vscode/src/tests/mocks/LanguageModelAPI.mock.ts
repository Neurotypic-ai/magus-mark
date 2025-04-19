import { vi } from 'vitest';

/**
 * Mock for LanguageModelAPI
 */
export class LanguageModelAPI {
  initializeApiKey: typeof vi.fn = vi.fn();
  getApiKey: typeof vi.fn = vi.fn().mockReturnValue('test-api-key');
  setDefaultModel: typeof vi.fn = vi.fn();
  registerLanguageModelProvider: typeof vi.fn = vi.fn();
  dispose: typeof vi.fn = vi.fn();
}

export default LanguageModelAPI;
