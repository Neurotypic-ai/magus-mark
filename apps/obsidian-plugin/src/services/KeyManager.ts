import { Notice } from 'obsidian';

import { APIError } from '@magus-mark/core/errors/APIError';
import { AppError } from '@magus-mark/core/errors/AppError';
import { FileSystemError } from '@magus-mark/core/errors/FileSystemError';
import { Result } from '@magus-mark/core/errors/Result';

import type ObsidianMagicPlugin from '../main';

/**
 * Handles secure storage and management of API keys
 * Provides multiple storage options:
 * - Electron secure storage
 * - Local encrypted storage
 */
export class KeyManager {
  private plugin: ObsidianMagicPlugin;

  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;
  }

  /**
   * Save API key to the selected storage method
   */
  async saveKey(apiKey: string): Promise<Result<boolean>> {
    try {
      if (!apiKey) {
        throw new APIError('API key cannot be empty', {
          code: 'API_KEY_EMPTY',
          recoverable: false,
        });
      }

      await this.saveToLocalStorage(apiKey);

      new Notice('API key has been saved successfully');
      return Result.ok(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to save API key: ${message}`);

      return Result.fail(error instanceof AppError ? error : new APIError(`Failed to save API key: ${message}`));
    }
  }

  /**
   * Load API key from the selected storage method
   */
  loadKey(): string | null {
    try {
      return this.loadFromLocalStorage();
    } catch (error) {
      console.error('Error loading API key:', error);
      new Notice(`Failed to load API key: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Delete API key from the selected storage method
   */
  async deleteKey(): Promise<Result<boolean>> {
    try {
      await this.deleteFromLocalStorage();
      new Notice('API key has been deleted successfully');
      return Result.ok(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to delete API key: ${message}`);

      return Result.fail(error instanceof AppError ? error : new APIError(`Failed to delete API key: ${message}`));
    }
  }

  /**
   * Validate if an API key is correctly formatted
   */
  validateKey(apiKey: string): boolean {
    // Simple validation for OpenAI API keys (sk-...)
    return !!apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;
  }

  /**
   * Save API key to local storage with simple encryption
   */
  private async saveToLocalStorage(apiKey: string): Promise<void> {
    try {
      // Simple encryption for local storage
      const encryptedKey = this.encryptKey(apiKey);
      this.plugin.settings.apiKey = encryptedKey;
      await this.plugin.saveSettings();
    } catch (error) {
      throw new FileSystemError(
        `Failed to save to local storage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load API key from local storage with simple decryption
   */
  private loadFromLocalStorage(): string | null {
    try {
      const encryptedKey = this.plugin.settings.apiKey;
      if (!encryptedKey) {
        return null;
      }

      return this.decryptKey(encryptedKey);
    } catch (error) {
      throw new FileSystemError(
        `Failed to load from local storage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete API key from local storage
   */
  private async deleteFromLocalStorage(): Promise<void> {
    try {
      this.plugin.settings.apiKey = '';
      await this.plugin.saveSettings();
    } catch (error) {
      throw new FileSystemError(
        `Failed to delete from local storage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Simple encryption for local storage
   * Note: This is not secure for production use, but provides basic obfuscation
   */
  private encryptKey(apiKey: string): string {
    // In a real implementation, use a proper encryption library
    // For demonstration, we'll use a simple Base64 encoding with a salt
    const salt = 'magus-mark';
    const input = salt + apiKey;
    return Buffer.from(input).toString('base64');
  }

  /**
   * Simple decryption for local storage
   */
  private decryptKey(encryptedKey: string): string {
    try {
      // In a real implementation, use a proper decryption library
      // For demonstration, we'll use a simple Base64 decoding with a salt
      const salt = 'magus-mark';
      const decoded = Buffer.from(encryptedKey, 'base64').toString();
      if (!decoded.startsWith(salt)) {
        throw new Error('Invalid encrypted key format');
      }
      return decoded.substring(salt.length);
    } catch (error) {
      throw new Error(`Failed to decrypt key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
