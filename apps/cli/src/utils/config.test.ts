import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocks are defined
import { config } from './config';

import type { Config } from '../types/config';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  pathExists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  ensureDir: vi.fn(),
  readJson: vi.fn(),
  writeJson: vi.fn(),
}));

// Mock conf
vi.mock('conf', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  })),
}));

describe('Config Utility', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await config.clear();
  });

  it('should get and set values correctly', async () => {
    // Set a value
    await config.set('apiKey', 'test-api-key');

    // Get the value
    const value = config.get('apiKey');

    // Verify
    expect(value).toBe('test-api-key');
  });

  it('should return undefined for non-existent keys', () => {
    const value = config.get('defaultModel');
    expect(value).toBeUndefined();
  });

  it('should handle undefined values correctly', () => {
    const value = config.get('apiKey');
    expect(value).toBeUndefined();
  });

  it('should get all values correctly', async () => {
    // Set multiple values
    await config.set('apiKey', 'test-api-key');
    await config.set('defaultModel', 'gpt-4');
    await config.set('outputFormat', 'pretty');

    // Get all values
    const values = config.getAll();

    // Verify
    expect(values).toEqual({
      apiKey: 'test-api-key',
      defaultModel: 'gpt-4',
      outputFormat: 'pretty',
    });
  });

  it('should check if a key exists', async () => {
    // Set a value
    await config.set('apiKey', 'test-api-key');

    // Check if key exists
    const hasKey = config.has('apiKey');
    const doesNotHaveKey = config.has('defaultModel');

    // Verify
    expect(hasKey).toBe(true);
    expect(doesNotHaveKey).toBe(false);
  });

  it('should delete a key correctly', async () => {
    // Set a value
    await config.set('apiKey', 'test-api-key');

    // Verify it exists
    expect(config.has('apiKey')).toBe(true);

    // Delete the key
    await config.delete('apiKey');

    // Verify it no longer exists
    expect(config.has('apiKey')).toBe(false);
    expect(config.get('apiKey')).toBeUndefined();
  });

  it('should clear all keys correctly', async () => {
    // Set multiple values
    await config.set('apiKey', 'value1');
    await config.set('defaultModel', 'gpt-4');

    // Verify they exist
    expect(config.getAll()).toEqual({
      apiKey: 'value1',
      defaultModel: 'gpt-4',
    });

    // Clear all keys
    await config.clear();

    // Verify all keys are cleared
    expect(config.getAll()).toEqual({});
  });

  it('should handle profile configuration', async () => {
    // Set a profile configuration
    const profileConfig: Record<string, Partial<Config>> = {
      development: {
        apiKey: 'dev-key',
        defaultModel: 'gpt-4',
        outputFormat: 'pretty' as const,
      },
      production: {
        apiKey: 'prod-key',
        defaultModel: 'gpt-3.5-turbo',
        outputFormat: 'json' as const,
      },
    };

    await config.set('profiles', profileConfig);

    // Get the value
    const value = config.get('profiles');

    // Verify
    expect(value).toEqual(profileConfig);
  });
});
