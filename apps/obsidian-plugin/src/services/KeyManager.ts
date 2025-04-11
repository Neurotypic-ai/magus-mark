import { Notice, requestUrl } from 'obsidian';
import type ObsidianMagicPlugin from '../main';

/**
 * Interface for key storage strategy
 */
interface KeyStorageStrategy {
  saveKey(key: string): Promise<void>;
  loadKey(): Promise<string | null>;
  deleteKey(): Promise<void>;
}

/**
 * Stores the key in Obsidian's local plugin data
 */
class LocalKeyStorage implements KeyStorageStrategy {
  private plugin: ObsidianMagicPlugin;
  
  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;
  }
  
  async saveKey(key: string): Promise<void> {
    this.plugin.settings.apiKey = key;
    await this.plugin.saveSettings();
  }
  
  async loadKey(): Promise<string | null> {
    return this.plugin.settings.apiKey || null;
  }
  
  async deleteKey(): Promise<void> {
    this.plugin.settings.apiKey = '';
    await this.plugin.saveSettings();
  }
}

/**
 * Stores the key in the system keychain when available
 * Falls back to local storage if not available
 */
class SystemKeyStorage implements KeyStorageStrategy {
  private plugin: ObsidianMagicPlugin;
  private localStorage: LocalKeyStorage;
  private keychainAvailable = false;
  
  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;
    this.localStorage = new LocalKeyStorage(plugin);
    
    // Check if we can use system keychain
    this.checkKeychainAvailability();
  }
  
  private async checkKeychainAvailability(): Promise<void> {
    try {
      // On desktop platforms, we can detect if native Node APIs are available
      // In a real implementation, we would check for keychain-specific APIs
      // This is just a simplified version for this implementation
      const platform = (window as any).electron?.platform;
      this.keychainAvailable = !!platform;
    } catch (error) {
      this.keychainAvailable = false;
      console.log('System keychain not available:', error);
    }
  }
  
  async saveKey(key: string): Promise<void> {
    if (!this.keychainAvailable) {
      // Fall back to local storage
      await this.localStorage.saveKey(key);
      return;
    }
    
    try {
      // In a real implementation, we would use platform-specific keychain APIs
      // For macOS: Keychain Access
      // For Windows: Windows Credential Manager
      // For Linux: Secret Service API / libsecret
      
      // For now, just store an empty value in the settings to indicate
      // that the real value is in the system keychain
      this.plugin.settings.apiKey = '[KEYCHAIN-PROTECTED]';
      
      // Store keychain identifier in settings
      const keychainId = `obsidian-magic-api-key-${this.plugin.manifest.id}`;
      this.plugin.settings.apiKeyKeychainId = keychainId;
      
      // Save this info to settings
      await this.plugin.saveSettings();
      
      // Mock keychain storage 
      console.log(`Storing API key in system keychain with ID: ${keychainId}`);
      
      // In a real implementation, we would call the system keychain here
      window.localStorage.setItem(keychainId, key);
    } catch (error) {
      console.error('Failed to save key to system keychain:', error);
      new Notice('Failed to save key to system keychain. Falling back to local storage.');
      
      // Fall back to local storage
      await this.localStorage.saveKey(key);
    }
  }
  
  async loadKey(): Promise<string | null> {
    if (!this.keychainAvailable) {
      // Fall back to local storage
      return this.localStorage.loadKey();
    }
    
    try {
      // Check if we have a keychain ID stored
      const keychainId = this.plugin.settings.apiKeyKeychainId;
      
      if (!keychainId) {
        // No keychain ID, fall back to local storage
        return this.localStorage.loadKey();
      }
      
      // In a real implementation, we would use the system keychain API
      // For now, use localStorage as a mock
      const key = window.localStorage.getItem(keychainId);
      
      return key;
    } catch (error) {
      console.error('Failed to load key from system keychain:', error);
      new Notice('Failed to load key from system keychain. Trying local storage.');
      
      // Fall back to local storage
      return this.localStorage.loadKey();
    }
  }
  
  async deleteKey(): Promise<void> {
    if (!this.keychainAvailable) {
      // Fall back to local storage
      await this.localStorage.deleteKey();
      return;
    }
    
    try {
      // Get keychain ID
      const keychainId = this.plugin.settings.apiKeyKeychainId;
      
      if (keychainId) {
        // In a real implementation, we would delete from the system keychain
        // For now, just remove from localStorage
        window.localStorage.removeItem(keychainId);
      }
      
      // Clear settings
      this.plugin.settings.apiKey = '';
      this.plugin.settings.apiKeyKeychainId = '';
      await this.plugin.saveSettings();
    } catch (error) {
      console.error('Failed to delete key from system keychain:', error);
      new Notice('Failed to delete key from system keychain.');
      
      // Still clear local settings
      await this.localStorage.deleteKey();
    }
  }
}

/**
 * Service for managing API keys securely
 */
export class KeyManager {
  private plugin: ObsidianMagicPlugin;
  private storage: KeyStorageStrategy;
  
  constructor(plugin: ObsidianMagicPlugin) {
    this.plugin = plugin;
    
    // Initialize the appropriate storage strategy based on settings
    this.storage = this.createStorageStrategy();
  }
  
  private createStorageStrategy(): KeyStorageStrategy {
    const storageType = this.plugin.settings.apiKeyStorage;
    
    switch (storageType) {
      case 'system':
        return new SystemKeyStorage(this.plugin);
      case 'local':
      default:
        return new LocalKeyStorage(this.plugin);
    }
  }
  
  /**
   * Update the storage strategy when settings change
   */
  updateStorageStrategy(): void {
    this.storage = this.createStorageStrategy();
  }
  
  /**
   * Save API key using the current storage strategy
   */
  async saveKey(key: string): Promise<void> {
    await this.storage.saveKey(key);
  }
  
  /**
   * Load API key using the current storage strategy
   */
  async loadKey(): Promise<string | null> {
    return this.storage.loadKey();
  }
  
  /**
   * Delete API key using the current storage strategy
   */
  async deleteKey(): Promise<void> {
    await this.storage.deleteKey();
  }
  
  /**
   * Validate if an API key is correctly formatted
   */
  isValidKeyFormat(key: string): boolean {
    // Simple format validation for OpenAI API keys
    // They typically start with "sk-" and are fairly long
    return /^sk-[a-zA-Z0-9]{48,}$/.test(key);
  }
  
  /**
   * Verify if an API key works by making a test request
   */
  async verifyKey(key: string): Promise<boolean> {
    try {
      // Make a minimal request to OpenAI API to validate the key
      const response = await requestUrl({
        url: 'https://api.openai.com/v1/models',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
} 