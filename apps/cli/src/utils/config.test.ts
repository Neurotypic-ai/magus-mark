import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mock is defined
import { config } from './config';

// Mock fs-extra and Conf, but leave config implementation alone
vi.mock('fs-extra', () => ({ ... }));
vi.mock('conf', () => ({ ... }));

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
    const value = config.get('nonExistentKey');
    expect(value).toBeUndefined();
  });

  it('should return a default value for non-existent keys if provided', () => {
    const value = config.get('nonExistentKey', 'default-value');
    expect(value).toBe('default-value');
  });

  it('should get all values correctly', async () => {
    // Set multiple values
    await config.set('apiKey', 'test-api-key');
    await config.set('model', 'gpt-4o');
    await config.set('outputFormat', 'pretty');

    // Get all values
    const values = config.getAll();

    // Verify
    expect(values).toEqual({
      apiKey: 'test-api-key',
      model: 'gpt-4o',
      outputFormat: 'pretty',
    });
  });

  it('should check if a key exists', async () => {
    // Set a value
    await config.set('apiKey', 'test-api-key');

    // Check if key exists
    const hasKey = config.has('apiKey');
    const doesNotHaveKey = config.has('nonExistentKey');

    // Verify
    expect(hasKey).toBe(true);
    expect(doesNotHaveKey).toBe(false);
  });

  it('should delete a key correctly', async () => {
    // Set a value
    await config.set('tempKey', 'temp-value');

    // Verify it exists
    expect(config.has('tempKey')).toBe(true);

    // Delete the key
    await config.delete('tempKey');

    // Verify it no longer exists
    expect(config.has('tempKey')).toBe(false);
    expect(config.get('tempKey')).toBeUndefined();
  });

  it('should clear all keys correctly', async () => {
    // Set multiple values
    await config.set('key1', 'value1');
    await config.set('key2', 'value2');

    // Verify they exist
    expect(config.getAll()).toEqual({
      key1: 'value1',
      key2: 'value2',
    });

    // Clear all keys
    await config.clear();

    // Verify all keys are cleared
    expect(config.getAll()).toEqual({});
  });

  it('should handle complex values', async () => {
    // Set a complex value
    const complexValue = {
      nested: {
        array: [1, 2, 3],
        object: { a: 1, b: 2 },
      },
    };

    await config.set('complex', complexValue);

    // Get the value
    const value = config.get('complex');

    // Verify
    expect(value).toEqual(complexValue);
  });
});
