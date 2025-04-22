import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ObsidianMagicPlugin from './main';
import { DocumentTagService } from './services/DocumentTagService';
import { KeyManager } from './services/KeyManager';
import { TaggingService } from './services/TaggingService';

import type { TFile, TFolder } from 'obsidian';

// Mock file interface with expected properties
interface MockFile {
  path: string;
  basename: string;
  extension: string;
}

// Mock Obsidian API with proper typing
const mockApp = {
  workspace: {
    onLayoutReady: vi.fn().mockImplementation((callback: () => void) => {
      callback();
      return { unsubscribe: vi.fn() };
    }),
    on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    getActiveFile: vi.fn().mockReturnValue({
      path: 'test/document.md',
      basename: 'document',
      extension: 'md',
    }),
    getLeavesOfType: vi.fn().mockReturnValue([]),
    detachLeavesOfType: vi.fn(),
    getRightLeaf: vi.fn().mockReturnValue({
      setViewState: vi.fn().mockResolvedValue(undefined),
    }),
    revealLeaf: vi.fn(),
  },
  vault: {
    on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    getMarkdownFiles: vi.fn().mockReturnValue([
      {
        path: 'file1.md',
        basename: 'file1',
        extension: 'md',
      },
      {
        path: 'file2.md',
        basename: 'file2',
        extension: 'md',
      },
    ]),
    read: vi.fn().mockImplementation((file: MockFile) => {
      if (file.path === 'file1.md') {
        return Promise.resolve(`---
title: Test Document 1
tags: [existing-tag-1, existing-tag-2]
---

# Test Document 1

This is test document 1 content.`);
      } else {
        return Promise.resolve(`---
title: Test Document 2
---

# Test Document 2

This is test document 2 content.`);
      }
    }),
    modify: vi.fn().mockResolvedValue(undefined),
    createFolder: vi.fn().mockResolvedValue(undefined),
    createBinary: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  metadataCache: {
    on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    getFileCache: vi.fn().mockImplementation((file: MockFile) => {
      if (file.path === 'file1.md') {
        return {
          frontmatter: {
            title: 'Test Document 1',
            tags: ['existing-tag-1', 'existing-tag-2'],
          },
        };
      } else {
        return {
          frontmatter: {
            title: 'Test Document 2',
          },
        };
      }
    }),
  },
};

// Mock OpenAI API response
const mockTagDocument = vi.fn().mockResolvedValue({
  success: true,
  data: {
    domain: 'software-development',
    subdomains: ['coding', 'documentation'],
    lifeAreas: ['learning'],
    conversationType: 'tutorial',
    contextualTags: ['obsidian-plugin', 'markdown'],
    year: '2023',
  },
});

// Mock secure storage
const mockSecureStorage = {
  setPassword: vi.fn().mockResolvedValue(undefined),
  getPassword: vi.fn().mockResolvedValue('test-api-key'),
  deletePassword: vi.fn().mockResolvedValue(undefined),
  isAvailable: vi.fn().mockReturnValue(true),
};

// Create mock functions for TaggingService
const mockProcessFile = vi.fn().mockResolvedValue({ success: true });
const mockProcessFiles = vi.fn().mockResolvedValue([{ success: true }]);
const mockUpdateApiKey = vi.fn();
const mockUpdateModelPreference = vi.fn();

// Mock core module
vi.mock('@magus-mark/core', () => {
  return {
    initializeCore: vi.fn().mockReturnValue({
      taggingService: {
        tagDocument: mockTagDocument,
      },
    }),
  };
});

// Mock utils module
vi.mock('@magus-mark/utils', () => ({
  secureStorage: mockSecureStorage,
}));

// Mock the TaggingService with our mock functions
vi.mock('../src/services/TaggingService', () => {
  return {
    TaggingService: vi.fn().mockImplementation(() => {
      return {
        processFile: mockProcessFile,
        processFiles: mockProcessFiles,
        updateApiKey: mockUpdateApiKey,
        updateModelPreference: mockUpdateModelPreference,
      };
    }),
  };
});

describe('Integration Tests', () => {
  let plugin: ObsidianMagicPlugin;

  beforeEach(async () => {
    vi.clearAllMocks();
    // @ts-expect-error - In the real code, this would take parameters
    plugin = new ObsidianMagicPlugin();
    await plugin.onload();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('File Tagging Flow', () => {
    it('should tag a file from start to finish successfully', async () => {
      // Set up mock to return success
      mockProcessFile.mockResolvedValueOnce({ success: true });

      // Get mockFile
      const mockFile = {
        path: 'file1.md',
        basename: 'file1',
        extension: 'md',
      } as TFile;

      // Process the file
      const result = await plugin.taggingService.processFile(mockFile);

      // Verify API was called correctly
      expect(mockTagDocument).toHaveBeenCalled();
      const calls = mockTagDocument.mock.calls;
      const apiCallContent = (calls[0]?.[0] ?? '') as string;
      expect(apiCallContent).toContain('Test Document 1');

      // Check the result
      expect(result.isOk()).toBe(true);

      // Verify file was modified with tags
      expect(mockApp.vault.modify).toHaveBeenCalled();
      const modifyCalls = mockApp.vault.modify.mock.calls;
      const modifiedContent = (modifyCalls[0]?.[1] ?? '') as string;
      expect(modifiedContent).toContain('domain: software-development');
      expect(modifiedContent).toContain('subdomains:');
      expect(modifiedContent).toContain('coding');
      expect(modifiedContent).toContain('documentation');
      expect(modifiedContent).toContain('contextualTags:');
      expect(modifiedContent).toContain('obsidian-plugin');
      expect(modifiedContent).toContain('markdown');
    });

    it('should handle files without existing frontmatter', async () => {
      // Mock a file without frontmatter
      mockApp.vault.read = vi.fn().mockResolvedValue('# Test Document\n\nNo frontmatter here.');
      mockApp.metadataCache.getFileCache = vi.fn().mockReturnValue({});

      const mockFile = {
        path: 'no-frontmatter.md',
        basename: 'no-frontmatter',
        extension: 'md',
      } as TFile;

      // Process the file
      await plugin.taggingService.processFile(mockFile);

      // Verify file was modified with new frontmatter
      expect(mockApp.vault.modify).toHaveBeenCalled();
      const modifyCalls = mockApp.vault.modify.mock.calls;
      const modifiedContent = (modifyCalls[0]?.[1] ?? '') as string;
      expect(modifiedContent).toMatch(/^---/);
      expect(modifiedContent).toContain('domain: software-development');
      expect(modifiedContent).toContain('# Test Document');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockTagDocument.mockRejectedValueOnce(new Error('API error'));
      mockProcessFile.mockResolvedValueOnce({ success: false, error: new Error('API error') });

      const mockFile = {
        path: 'file1.md',
        basename: 'file1',
        extension: 'md',
      } as TFile;

      // Process the file
      const result = await plugin.taggingService.processFile(mockFile);

      // Check error handling
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeDefined();

      // Verify file was not modified
      expect(mockApp.vault.modify).not.toHaveBeenCalled();
    });
  });

  describe('Folder Tagging Flow', () => {
    it('should tag all files in a folder', async () => {
      // Mock folder with files
      const mockFolder = {
        path: 'test-folder',
        name: 'test-folder',
        isFolder: () => true,
      } as unknown as TFolder;

      // Mock files in the folder
      const mockFiles = [
        { path: 'test-folder/file1.md', basename: 'file1', extension: 'md' },
        { path: 'test-folder/file2.md', basename: 'file2', extension: 'md' },
      ] as TFile[];

      mockApp.vault.getMarkdownFiles = vi.fn().mockReturnValue(mockFiles);

      // Tag the folder
      await plugin.tagFolder(mockFolder);

      // Verify tagging service was called with both files
      expect(plugin.taggingService.processFiles).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ path: 'test-folder/file1.md' }),
          expect.objectContaining({ path: 'test-folder/file2.md' }),
        ]),
        expect.any(Function)
      );
    });

    it('should filter non-markdown files when tagging a folder', async () => {
      // Mock folder with mixed files
      const mockFolder = {
        path: 'mixed-folder',
        name: 'mixed-folder',
        isFolder: () => true,
      } as unknown as TFolder;

      // Mock files in the folder (including non-markdown)
      const allFiles = [
        { path: 'mixed-folder/file1.md', basename: 'file1', extension: 'md' },
        { path: 'mixed-folder/image.png', basename: 'image', extension: 'png' },
        { path: 'mixed-folder/doc.pdf', basename: 'doc', extension: 'pdf' },
      ];

      mockApp.vault.getMarkdownFiles = vi.fn().mockReturnValue(allFiles.filter((f) => f.extension === 'md') as TFile[]);

      // Setup mock implementation to capture args
      let capturedFiles: TFile[] = [];
      mockProcessFiles.mockImplementation((files: TFile[]) => {
        capturedFiles = files;
        return Promise.resolve([{ success: true }]);
      });

      // Tag the folder
      await plugin.tagFolder(mockFolder);

      // Verify the correct files were passed to processFiles
      expect(mockProcessFiles).toHaveBeenCalled();
      expect(capturedFiles.length).toBe(1);
      expect(capturedFiles[0]?.path).toBe('mixed-folder/file1.md');
    });
  });

  describe('Key Management Flow', () => {
    it('should save API key correctly', async () => {
      // Set new API key
      await plugin.keyManager.saveKey('new-api-key');

      // Verify settings were saved
      expect(plugin.settings.apiKey).toBe('new-api-key');
      expect(plugin.saveData).toHaveBeenCalled();

      // Verify tagging service was updated
      expect(mockUpdateApiKey).toHaveBeenCalledWith('new-api-key');
    });

    it('should store API key in system keychain when configured', async () => {
      // Configure to use system keychain
      plugin.settings.apiKeyStorage = 'system';

      // Save new API key
      await plugin.keyManager.saveKey('secure-api-key');

      // Verify key saved to system keychain
      expect(mockSecureStorage.setPassword).toHaveBeenCalledWith(plugin.settings.apiKeyKeychainId, 'secure-api-key');

      // Verify local storage cleared
      expect(plugin.settings.apiKey).toBe('');
      expect(plugin.saveData).toHaveBeenCalled();
    });

    it('should load API key from appropriate storage', async () => {
      // Test loading from local
      plugin.settings.apiKeyStorage = 'local';
      plugin.settings.apiKey = 'local-key';

      let key = await plugin.keyManager.loadKey();
      expect(key).toBe('local-key');

      // Test loading from system
      plugin.settings.apiKeyStorage = 'system';
      plugin.settings.apiKey = '';

      key = await plugin.keyManager.loadKey();
      expect(key).toBe('test-api-key');
      expect(mockSecureStorage.getPassword).toHaveBeenCalledWith(plugin.settings.apiKeyKeychainId);
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should initialize all required services on load', async () => {
      // Create a fresh plugin instance
      // @ts-expect-error - In the real code, this would take parameters
      const newPlugin = new ObsidianMagicPlugin();

      // Load the plugin
      await newPlugin.onload();

      // Verify all services were created
      expect(newPlugin.keyManager).toBeInstanceOf(KeyManager);
      expect(newPlugin.taggingService).toBeInstanceOf(TaggingService);
      expect(newPlugin.documentTagService).toBeInstanceOf(DocumentTagService);

      // Verify views were registered
      expect(newPlugin.registerView).toHaveBeenCalledTimes(2);

      // Verify commands were registered
      expect(newPlugin.addCommand).toHaveBeenCalledTimes(4);
    });

    it('should clean up resources on unload', async () => {
      // Create and load a plugin
      // @ts-expect-error - In the real code, this would take parameters
      const newPlugin = new ObsidianMagicPlugin();
      await newPlugin.onload();

      // Unload the plugin
      newPlugin.onunload();

      // Verify resources were cleaned up
      expect(mockApp.workspace.detachLeavesOfType).toHaveBeenCalledTimes(2);
    });

    it('should load and apply settings properly', async () => {
      // Mock settings data
      const mockSettings = {
        apiKey: 'saved-api-key',
        apiKeyStorage: 'local',
        defaultTagBehavior: 'replace',
        enableAutoSync: true,
        modelPreference: 'gpt-3.5-turbo',
        showRibbonIcon: false,
        statusBarDisplay: 'never',
      };

      // Create a plugin with custom settings
      // @ts-expect-error - In the real code, this would take parameters
      const newPlugin = new ObsidianMagicPlugin();
      newPlugin.loadData = vi.fn().mockResolvedValue(mockSettings);

      // Load the plugin
      await newPlugin.onload();

      // Verify settings were loaded and applied
      expect(newPlugin.settings).toEqual(expect.objectContaining(mockSettings));

      // Verify settings affected UI elements
      expect(newPlugin.addRibbonIcon).not.toHaveBeenCalled(); // showRibbonIcon: false
      expect(newPlugin.addStatusBarItem).not.toHaveBeenCalled(); // statusBarDisplay: never

      // Verify tagging service was configured with model preference
      expect(mockUpdateModelPreference).toHaveBeenCalledWith('gpt-3.5-turbo');
    });
  });
});
