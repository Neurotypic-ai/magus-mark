import { Notice, Platform } from 'obsidian';

import { APIError, AppError, FileSystemError, Result } from '@obsidian-magic/core';

import type * as Electron from 'electron';

import type ObsidianMagicPlugin from '../main';

// Safely access Electron APIs at runtime using the Obsidian-recommended pattern
/* eslint-disable */
const electron: typeof Electron | null = Platform.isDesktopApp ? window.require('electron') : null;
/* eslint-enable */

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

      if (this.plugin.settings.apiKeyStorage === 'system') {
        await this.saveToSystemKeychain(apiKey);
      } else {
        await this.saveToLocalStorage(apiKey);
      }

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
  async loadKey(): Promise<string | null> {
    try {
      if (this.plugin.settings.apiKeyStorage === 'system') {
        return await this.loadFromSystemKeychain();
      } else {
        return this.loadFromLocalStorage();
      }
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
      if (this.plugin.settings.apiKeyStorage === 'system') {
        await this.deleteFromSystemKeychain();
      } else {
        await this.deleteFromLocalStorage();
      }

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
   * Save API key to the system keychain
   */
  private async saveToSystemKeychain(apiKey: string): Promise<void> {
    try {
      if (!electron) {
        throw new APIError('System keychain is not available: Electron not detected');
      }

      const { ipcRenderer } = electron;
      await ipcRenderer.invoke('set-secure-key', this.plugin.settings.apiKeyKeychainId, apiKey);

      // Clear from local storage
      this.plugin.settings.apiKey = '';
      await this.plugin.saveSettings();
    } catch (error) {
      throw new APIError(
        `Failed to save to system keychain: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load API key from the system keychain
   */
  private async loadFromSystemKeychain(): Promise<string | null> {
    try {
      if (!electron) {
        throw new APIError('System keychain is not available: Electron not detected');
      }

      const { ipcRenderer } = electron;
      return (await ipcRenderer.invoke('get-secure-key', this.plugin.settings.apiKeyKeychainId)) as string | null;
    } catch (error) {
      throw new APIError(
        `Failed to load from system keychain: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete API key from the system keychain
   */
  private async deleteFromSystemKeychain(): Promise<void> {
    try {
      if (!electron) {
        throw new APIError('System keychain is not available: Electron not detected');
      }

      const { ipcRenderer } = electron;
      await ipcRenderer.invoke('delete-secure-key', this.plugin.settings.apiKeyKeychainId);
    } catch (error) {
      throw new APIError(
        `Failed to delete from system keychain: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
    const salt = 'obsidian-magic';
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
      const salt = 'obsidian-magic';
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
