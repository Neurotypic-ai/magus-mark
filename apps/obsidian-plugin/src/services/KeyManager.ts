import { Notice } from 'obsidian';

import { APIError } from '@magus-mark/core/errors/APIError';
import { ApiKeyError } from '@magus-mark/core/errors/ApiKeyError';
import { AppError } from '@magus-mark/core/errors/AppError';
import { FileSystemError } from '@magus-mark/core/errors/FileSystemError';
import { Result } from '@magus-mark/core/errors/Result';
import { OpenAIClient } from '@magus-mark/core/openai/OpenAIClient';

import type MagusMarkPlugin from '../main';

/**
 * Handles secure storage and management of API keys
 * Provides multiple storage options:
 * - Electron secure storage
 * - Local encrypted storage
 */
export class KeyManager {
  private plugin: MagusMarkPlugin;

  constructor(plugin: MagusMarkPlugin) {
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
        const saved = await this.saveToSystemStorage(apiKey);
        if (!saved) {
          // Fallback to local storage with a clear notice
          new Notice('System key storage not available. Falling back to local storage.');
          await this.saveToLocalStorage(apiKey);
        }
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
  loadKey(): string | null {
    try {
      if (this.plugin.settings.apiKeyStorage === 'system') {
        const sys = this.loadFromSystemStorage();
        if (sys !== null) return sys;
        // Fallback read from local if system read fails
        return this.loadFromLocalStorage();
      }
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
      if (this.plugin.settings.apiKeyStorage === 'system') {
        const deleted = await this.deleteFromSystemStorage();
        if (!deleted) {
          await this.deleteFromLocalStorage();
        }
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
   * Test if an API key has the necessary permissions
   * @param apiKey The API key to test
   * @returns A Promise resolving to a Result with a boolean or an error
   */
  async testApiKey(apiKey: string): Promise<Result<boolean>> {
    try {
      if (!this.validateKey(apiKey)) {
        return Result.fail(new ApiKeyError('Invalid API key format. OpenAI keys typically start with "sk-"'));
      }

      // Create a temporary client to test the API key
      const client = new OpenAIClient({ apiKey });

      try {
        // Try to get available models, which requires the model.request scope
        const models = await client.getAvailableModels();

        if (models.length === 0) {
          return Result.fail(
            new ApiKeyError('API key validation failed. Your API key may not have the necessary permissions.')
          );
        }

        return Result.ok(true);
      } catch (error) {
        const errorStr = String(error);

        // Check for specific permission errors
        if (
          errorStr.includes('401') &&
          (errorStr.includes('model.request') || errorStr.includes('insufficient permissions'))
        ) {
          return Result.fail(
            new ApiKeyError(
              'Your API key is missing the "model.request" scope. Please generate a new API key with the correct permissions from the OpenAI dashboard.'
            )
          );
        } else if (errorStr.includes('401')) {
          return Result.fail(new ApiKeyError('Authentication failed. Please check that your API key is valid.'));
        } else if (errorStr.includes('429')) {
          return Result.fail(
            new APIError('Rate limit exceeded. Please try again later.', {
              statusCode: 429,
              recoverable: true,
            })
          );
        } else {
          return Result.fail(
            new APIError(`API key validation failed: ${errorStr}`, {
              recoverable: false,
            })
          );
        }
      }
    } catch (error) {
      return Result.fail(
        error instanceof AppError ? error : new APIError(`API key validation failed: ${String(error)}`)
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

      // If key is stored using other schemes, ignore here
      if (encryptedKey.startsWith('safe:') || encryptedKey.startsWith('wcg:')) {
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
   * Attempt to save the API key using a system-backed storage mechanism.
   * Prefers Electron safeStorage, falls back to WebCrypto AES-GCM if available.
   * Returns true if saved using a system method, false if unavailable.
   */
  private async saveToSystemStorage(apiKey: string): Promise<boolean> {
    // Try Electron safeStorage first
    try {
      const mod = await this.tryImportElectron();
      if (mod?.safeStorage?.isEncryptionAvailable()) {
        const encryptedBuf: Buffer = mod.safeStorage.encryptString(apiKey);
        this.plugin.settings.apiKey = `safe:${encryptedBuf.toString('base64')}`;
        await this.plugin.saveSettings();
        return true;
      }
    } catch {
      // ignore and try WebCrypto
    }

    // Fallback to WebCrypto AES-GCM
    if (this.hasWebCrypto()) {
      const { cipherTextB64, ivB64, saltB64 } = await this.encryptWithWebCrypto(apiKey);
      this.plugin.settings.apiKey = `wcg:v1:${saltB64}:${ivB64}:${cipherTextB64}`;
      await this.plugin.saveSettings();
      return true;
    }

    return false;
  }

  /**
   * Attempt to load the API key from system storage. Returns null if not available.
   */
  private loadFromSystemStorage(): string | null {
    const stored = this.plugin.settings.apiKey;
    if (!stored) return null;

    // Electron safeStorage format
    if (stored.startsWith('safe:')) {
      const b64 = stored.slice('safe:'.length);
      try {
        const electron = this.getElectronSync();
        if (electron?.safeStorage?.isEncryptionAvailable()) {
          const buf = Buffer.from(b64, 'base64');
          return electron.safeStorage.decryptString(buf);
        }
      } catch (e) {
        console.warn('safeStorage read failed, falling back if possible', e);
      }
      return null;
    }

    // WebCrypto format
    if (stored.startsWith('wcg:')) {
      if (!this.hasWebCrypto()) return null;
      try {
        return this.decryptWithWebCrypto(stored);
      } catch (e) {
        console.warn('WebCrypto decrypt failed', e);
        return null;
      }
    }

    return null;
  }

  /**
   * Attempt to delete the API key from system storage. Returns false if not available.
   */
  private async deleteFromSystemStorage(): Promise<boolean> {
    const stored = this.plugin.settings.apiKey;
    if (!stored) return true;

    if (stored.startsWith('safe:') || stored.startsWith('wcg:')) {
      try {
        this.plugin.settings.apiKey = '';
        await this.plugin.saveSettings();
        return true;
      } catch (error) {
        throw new FileSystemError(
          `Failed to delete from system storage: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return false;
  }

  // ---------- Electron helpers ----------
  private async tryImportElectron(): Promise<{
    safeStorage?: {
      isEncryptionAvailable(): boolean;
      encryptString(v: string): Buffer;
      decryptString(b: Buffer): string;
    };
  } | null> {
    try {
      // Dynamic import to avoid bundling/resolution issues
      const mod = await import('electron');
      return mod as unknown as {
        safeStorage?: {
          isEncryptionAvailable(): boolean;
          encryptString(v: string): Buffer;
          decryptString(b: Buffer): string;
        };
      };
    } catch {
      return null;
    }
  }

  private getElectronSync(): {
    safeStorage?: {
      isEncryptionAvailable(): boolean;
      encryptString(v: string): Buffer;
      decryptString(b: Buffer): string;
    };
  } | null {
    try {
      // In CJS at runtime, require may be available
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod: unknown = require('electron');
      return mod as {
        safeStorage?: {
          isEncryptionAvailable(): boolean;
          encryptString(v: string): Buffer;
          decryptString(b: Buffer): string;
        };
      };
    } catch {
      return null;
    }
  }

  private hasWebCrypto(): boolean {
    return 'crypto' in globalThis && 'subtle' in globalThis.crypto;
  }

  // ---------- WebCrypto AES-GCM helpers ----------
  private async encryptWithWebCrypto(
    plainText: string
  ): Promise<{ cipherTextB64: string; ivB64: string; saltB64: string }> {
    const enc = new TextEncoder();
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(salt);
    const cipherBuf = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));
    const cipherTextB64 = Buffer.from(new Uint8Array(cipherBuf)).toString('base64');
    const ivB64 = Buffer.from(iv).toString('base64');
    const saltB64 = Buffer.from(salt).toString('base64');
    return { cipherTextB64, ivB64, saltB64 };
  }

  private async deriveKey(salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    // Derive from app id and a static purpose string
    const base = `magus-mark:${this.plugin.manifest.id}:system-key`;
    const keyMaterial = await globalThis.crypto.subtle.importKey('raw', enc.encode(base), { name: 'PBKDF2' }, false, [
      'deriveKey',
    ]);
    return globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private decryptWithWebCrypto(stored: string): string {
    // Format: wcg:v1:<saltB64>:<ivB64>:<cipherTextB64>
    const parts = stored.split(':');
    if (parts.length !== 5) throw new Error('Invalid WebCrypto format');
    const saltB64 = parts[2];
    const ivB64 = parts[3];
    const cipherB64 = parts[4];
    if (!saltB64 || !ivB64 || !cipherB64) throw new Error('Invalid WebCrypto format');
    const salt = Uint8Array.from(Buffer.from(saltB64, 'base64'));
    const iv = Uint8Array.from(Buffer.from(ivB64, 'base64'));
    const cipherBytes = Uint8Array.from(Buffer.from(cipherB64, 'base64'));

    // Use Node's crypto for synchronous AES-GCM decryption (ciphertext|tag format)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('node:crypto') as {
      pbkdf2Sync: (password: Buffer, salt: Buffer, iterations: number, keylen: number, digest: string) => Buffer;
      createDecipheriv: (
        algorithm: string,
        key: Buffer,
        iv: Buffer
      ) => {
        setAuthTag: (tag: Buffer) => void;
        update: (data: Buffer) => Buffer;
        final: () => Buffer;
      };
    };
    const enc = new TextEncoder();
    const base = `magus-mark:${this.plugin.manifest.id}:system-key`;
    const keyBuf = crypto.pbkdf2Sync(Buffer.from(enc.encode(base)), Buffer.from(salt), 100_000, 32, 'sha256');

    const tagLength = 16; // AES-GCM auth tag is 16 bytes
    if (cipherBytes.length <= tagLength) throw new Error('Invalid cipher length');
    const data = Buffer.from(cipherBytes.slice(0, cipherBytes.length - tagLength));
    const tag = Buffer.from(cipherBytes.slice(cipherBytes.length - tagLength));

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, Buffer.from(iv));
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf-8');
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
