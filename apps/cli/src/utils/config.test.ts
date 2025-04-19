import { beforeEach, describe, expect, it, vi } from 'vitest';

// Now import config
import { config } from './config';

import type { Config } from '../types/config';

// Mock conf before importing config
vi.mock('conf', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    store: {},
  })),
}));

// Mock fs-extra before importing config
vi.mock('fs-extra', () => ({
  pathExists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  ensureDir: vi.fn(),
  readJson: vi.fn(),
  writeJson: vi.fn(),
}));

// Define default config for comparison
const DEFAULT_CONFIG = {
  apiKey: '',
  tagMode: 'merge',
  minConfidence: 0.7,
  reviewThreshold: 0.5,
  concurrency: 3,
  outputFormat: 'pretty',
  logLevel: 'info',
  costLimit: 10,
  onLimitReached: 'warn',
  enableAnalytics: true,
  profiles: {},
  activeProfile: undefined,
  outputDir: undefined,
  vaultPath: undefined,
  generateExplanations: true,
  defaultModel: undefined, // Explicitly undefined
};

describe('Config Utility', () => {
  beforeEach(async () => {
    // Reset mocks and clear config before each test
    vi.clearAllMocks();
    // Simulate clearing the internal data store
    (config as any).data = { ...DEFAULT_CONFIG };
    // No need to call config.clear() which interacts with mocks
  });

  it('should get and set values correctly', async () => {
    // Set a value
    await config.set('apiKey', 'test-api-key');

    // Get the value
    const value = config.get('apiKey');

    // Verify
    expect(value).toBe('test-api-key');
    expect((config as any).save).toHaveBeenCalled(); // Verify save was called
  });

  it('should return undefined for non-existent keys', () => {
    // Accessing a key that hasn't been set and isn't in defaults explicitly
    const value = config.get('nonExistentKey' as keyof Config);
    expect(value).toBeUndefined();
  });

  it('should return undefined for defaultModel if not set', () => {
    // defaultModel should be undefined by default
    const value = config.get('defaultModel');
    expect(value).toBeUndefined();
  });

  it('should return empty string for apiKey if not set', () => {
    // apiKey has a default empty string value
    const value = config.get('apiKey');
    expect(value).toBe('');
  });

  it('should get all values correctly, merging with defaults', async () => {
    // Set some values
    await config.set('apiKey', 'test-api-key');
    await config.set('concurrency', 5);

    // Get all values
    const values = config.getAll();

    // Verify - should include set values and all defaults
    expect(values).toEqual({
      ...DEFAULT_CONFIG,
      apiKey: 'test-api-key',
      concurrency: 5,
    });
  });

  it('should check if a key exists (including defaults)', async () => {
    // Set a value
    await config.set('apiKey', 'test-api-key');

    // Check if key exists
    expect(config.has('apiKey')).toBe(true); // Set value
    expect(config.has('tagMode')).toBe(true); // Default value
    expect(config.has('nonExistentKey')).toBe(false); // Does not exist
  });

  it('should delete a key correctly', async () => {
    // Set a value
    await config.set('apiKey', 'test-api-key');
    expect(config.get('apiKey')).toBe('test-api-key');

    // Delete the key
    await config.delete('apiKey');

    // Verify it reverts to default (empty string), not undefined
    expect(config.has('apiKey')).toBe(true); // Key still exists due to default
    expect(config.get('apiKey')).toBe('');
    expect((config as any).save).toHaveBeenCalledTimes(2); // Set and Delete
  });

  it('should clear all keys correctly, reverting to defaults', async () => {
    // Set multiple values
    await config.set('apiKey', 'value1');
    await config.set('defaultModel', 'gpt-4');
    await config.set('concurrency', 8);

    // Verify they are set
    expect(config.get('apiKey')).toBe('value1');
    expect(config.get('defaultModel')).toBe('gpt-4');
    expect(config.get('concurrency')).toBe(8);

    // Clear all keys
    await config.clear();

    // Verify all keys are reverted to defaults
    expect(config.getAll()).toEqual(DEFAULT_CONFIG);
    expect((config as any).save).toHaveBeenCalledTimes(3); // 2 sets + 1 clear
  });

  it('should handle profile configuration', async () => {
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

    // Set profiles
    await config.set('profiles', profileConfig);
    expect(config.get('profiles')).toEqual(profileConfig);

    // Activate a profile
    await config.set('activeProfile', 'development');
    expect(config.get('activeProfile')).toBe('development');

    // Verify values are read from the active profile
    expect(config.get('apiKey')).toBe('dev-key');
    expect(config.get('defaultModel')).toBe('gpt-4');
    expect(config.get('outputFormat')).toBe('pretty');

    // Verify a non-profile key still uses the base/default value
    expect(config.get('concurrency')).toBe(DEFAULT_CONFIG.concurrency);

    // Switch profile
    await config.set('activeProfile', 'production');
    expect(config.get('apiKey')).toBe('prod-key');
    expect(config.get('defaultModel')).toBe('gpt-3.5-turbo');
    expect(config.get('outputFormat')).toBe('json');

    // Deactivate profile
    await config.set('activeProfile', undefined);
    expect(config.get('apiKey')).toBe(''); // Reverts to default
  });
});
