import { vi } from 'vitest';

/**
 * Mock for LanguageModelAPI
 */
export class LanguageModelAPI {
  initializeApiKey = vi.fn();
  getApiKey = vi.fn().mockReturnValue('test-api-key');
  setDefaultModel = vi.fn();
  registerLanguageModelProvider = vi.fn();
  dispose = vi.fn();
}

export default LanguageModelAPI;
