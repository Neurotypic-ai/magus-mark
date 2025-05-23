// Import error types from their specific paths
import { Notice } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError } from '@magus-mark/core/errors/APIError';
import { FileSystemError as CoreFileSystemError } from '@magus-mark/core/errors/FileSystemError';

import { KeyManager } from '../services/KeyManager';

import type { AppError as CoreAppError } from '@magus-mark/core/errors/AppError';
import type { Mock } from 'vitest';

import type MagusMarkPlugin from '../main';

// --- Mocks ---

// Local vi.mock('obsidian', ...) IS REMOVED
// Vitest will use apps/obsidian-plugin/src/__mocks__/obsidian.ts automatically.

// Helper for Base64 encoding matching KeyManager's encryptKey
const encryptKey = (apiKey: string): string => {
  const salt = 'magus-mark';
  const input = salt + apiKey;
  return Buffer.from(input).toString('base64');
};

// Define a simplified mock settings structure based on main.ts
interface MockSettings {
  apiKey: string;
  // Removed apiKeyStorage and apiKeyKeychainId since keychain support is removed
}

// --- Test Suite ---
describe('KeyManager', () => {
  let keyManager: KeyManager;
  let mockPlugin: MagusMarkPlugin;
  let mockSettings: MockSettings;

  beforeEach(() => {
    // Reset mocks and settings before each test
    vi.clearAllMocks(); // This will also clear the globally mocked Notice
    localStorage.clear();

    // Create mock settings
    mockSettings = {
      apiKey: '', // Start with no key in settings
    };

    // Create a simplified mock plugin instance
    // Use 'as any' to bypass strict type checks for mocking purposes
    mockPlugin = {
      app: {
        // Mock any app properties KeyManager might access, if any
      },
      settings: mockSettings, // Use the mock settings object
      loadData: vi.fn().mockResolvedValue(mockSettings), // Mock loading data
      // Correctly mock saveData and saveSettings with types
      saveData: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue(undefined),
      // Mock other plugin methods/properties if KeyManager uses them
    } as any;

    keyManager = new KeyManager(mockPlugin);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveKey', () => {
    it('should save encrypted key to local storage', async () => {
      const newKey = 'new-local-key';
      const expectedEncryptedKey = encryptKey(newKey);

      const result = await keyManager.saveKey(newKey);

      expect(mockPlugin.settings.apiKey).toBe(expectedEncryptedKey);
      expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(1);
      expect(result.isOk()).toBe(true);
      expect(Notice).toHaveBeenCalledWith('API key has been saved successfully');
    });

    it('should return error Result if API key is empty', async () => {
      const result = await keyManager.saveKey('');

      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(APIError);
      expect((result.getError() as CoreAppError).message).toContain('API key cannot be empty');
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      expect(Notice).toHaveBeenCalledWith('Failed to save API key: API key cannot be empty');
    });

    it('should return error Result if saving to local storage fails', async () => {
      const error = new Error('Disk full');
      // Cast to Mock to use mockImplementationOnce
      (mockPlugin.saveSettings as Mock).mockImplementationOnce(() => Promise.reject(error));

      const result = await keyManager.saveKey('key-to-fail');

      expect(result.isFail()).toBe(true);
      // KeyManager wraps this in FileSystemError
      expect(result.getError()).toBeInstanceOf(CoreFileSystemError);
      expect((result.getError() as CoreAppError).message).toContain('Failed to save to local storage: Disk full');
      expect(Notice).toHaveBeenCalledWith('Failed to save API key: Failed to save to local storage: Disk full');
    });
  });

  describe('loadKey', () => {
    it('should load and decrypt key from local storage', () => {
      const originalKey = 'my-local-key';
      mockPlugin.settings.apiKey = encryptKey(originalKey);

      // Call loadKey directly since it's now synchronous
      const key = keyManager.loadKey();

      expect(key).toBe(originalKey);
    });

    it('should return null if local key is empty', () => {
      mockPlugin.settings.apiKey = '';

      // Call loadKey directly since it's now synchronous
      const key = keyManager.loadKey();

      expect(key).toBeNull();
    });

    it('should return null and show Notice if local decryption fails', () => {
      // Set an invalid encrypted key that will fail decryption
      mockPlugin.settings.apiKey = 'invalid-encrypted-key';

      // Call loadKey directly since it's synchronous
      const key = keyManager.loadKey();

      expect(key).toBeNull();
      expect(Notice).toHaveBeenCalledWith(expect.stringContaining('Failed to load API key'));
    });
  });

  describe('deleteKey', () => {
    it('should clear key from local storage', async () => {
      // Set an initial key
      mockPlugin.settings.apiKey = encryptKey('key-to-delete');

      const result = await keyManager.deleteKey();

      expect(mockPlugin.settings.apiKey).toBe('');
      expect(mockPlugin.saveSettings).toHaveBeenCalledTimes(1);
      expect(result.isOk()).toBe(true);
      expect(Notice).toHaveBeenCalledWith('API key has been deleted successfully');
    });

    it('should return error Result if deleting from local storage fails', async () => {
      const error = new Error('Write failed');
      (mockPlugin.saveSettings as Mock).mockImplementationOnce(() => Promise.reject(error));

      const result = await keyManager.deleteKey();

      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(CoreFileSystemError);
      expect((result.getError() as CoreAppError).message).toContain(
        'Failed to delete from local storage: Write failed'
      );
      expect(Notice).toHaveBeenCalledWith(
        'Failed to delete API key: Failed to delete from local storage: Write failed'
      );
    });
  });

  describe('validateKey', () => {
    it('should return true for valid OpenAI keys', () => {
      const validKey = 'sk-1234567890abcdef1234567890abcdef';
      expect(keyManager.validateKey(validKey)).toBe(true);
    });

    it('should return false for invalid keys', () => {
      expect(keyManager.validateKey('')).toBe(false);
      expect(keyManager.validateKey('invalid-key')).toBe(false);
      expect(keyManager.validateKey('sk-short')).toBe(false);
    });
  });
});
