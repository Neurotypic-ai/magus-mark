import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyManager } from '../../src/services/KeyManager';

// Mock electron for testing secure storage
vi.mock('electron', () => {
  return {
    ipcRenderer: {
      invoke: vi.fn().mockResolvedValue('test-api-key')
    }
  };
});

// Mock node-keytar for testing system keychain
vi.mock('node-keytar', () => {
  return {
    default: {
      getPassword: vi.fn().mockResolvedValue('test-api-key'),
      setPassword: vi.fn().mockResolvedValue(undefined),
      deletePassword: vi.fn().mockResolvedValue(true)
    }
  };
});

describe('KeyManager', () => {
  let keyManager: KeyManager;
  
  const mockPlugin = {
    settings: {
      apiKey: '',
      apiKeyStorage: 'local',
      apiKeyKeychainId: 'obsidian-magic-api-key'
    },
    saveSettings: vi.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    keyManager = new KeyManager(mockPlugin as any);
    vi.clearAllMocks();
  });

  it('should store API key locally', async () => {
    mockPlugin.settings.apiKeyStorage = 'local';
    await keyManager.saveKey('new-api-key');
    
    expect(mockPlugin.settings.apiKey).not.toBe('new-api-key'); // Should be encrypted
    expect(mockPlugin.saveSettings).toHaveBeenCalled();
  });

  it('should retrieve API key from local storage', async () => {
    mockPlugin.settings.apiKeyStorage = 'local';
    mockPlugin.settings.apiKey = 'encrypted-key'; // Simulate encrypted key
    
    const key = await keyManager.loadKey();
    expect(typeof key).toBe('string');
  });

  it('should store API key in system keychain when available', async () => {
    mockPlugin.settings.apiKeyStorage = 'system';
    await keyManager.saveKey('new-api-key');
    
    expect(mockPlugin.settings.apiKey).toBe(''); // Key shouldn't be in settings
    expect(mockPlugin.saveSettings).toHaveBeenCalled();
  });

  it('should retrieve API key from system keychain when available', async () => {
    mockPlugin.settings.apiKeyStorage = 'system';
    
    const key = await keyManager.loadKey();
    expect(key).toBe('test-api-key');
  });

  it('should delete the API key', async () => {
    await keyManager.deleteKey();
    
    expect(mockPlugin.settings.apiKey).toBe('');
    expect(mockPlugin.saveSettings).toHaveBeenCalled();
  });
}); 