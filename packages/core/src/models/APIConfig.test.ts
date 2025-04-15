import { describe, expect, it } from 'vitest';

import type { APIConfig } from './APIConfig';

describe('APIConfig', () => {
  it('validates API config', () => {
    const config: APIConfig = {
      apiKey: 'test-api-key',
      apiKeyStorage: 'local',
      organizationId: 'org-123',
      defaultModel: 'gpt-4o',
      timeoutMs: 30000,
      maxRetries: 3,
      costPerTokenMap: {
        'gpt-4o': 0.00005,
        'gpt-4': 0.00003,
        'gpt-3.5-turbo': 0.00001,
      },
    };

    expect(config.apiKey).toBe('test-api-key');
    expect(config.apiKeyStorage).toBe('local');
    expect(config.defaultModel).toBe('gpt-4o');
    expect(config.timeoutMs).toBe(30000);
    expect(config.maxRetries).toBe(3);
    expect(config.costPerTokenMap['gpt-4o']).toBe(0.00005);
  });
});
