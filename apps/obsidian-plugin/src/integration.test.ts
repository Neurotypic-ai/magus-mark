import { App } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ObsidianMagicPlugin from './main';
import { DocumentTagService } from './services/DocumentTagService';
import { KeyManager } from './services/KeyManager';
import { TaggingService } from './services/TaggingService';

import type { PluginManifest, TFile, TFolder } from 'obsidian';
import type { Mock } from 'vitest';

vi.mock('obsidian');

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

// --- MOCKS TO ADD/VERIFY ---
const mockIpcRendererInvoke = vi.fn();
vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: mockIpcRendererInvoke,
  },
}));
// --- Start Refactored Mocks for 'obsidian' ---
let getMarkdownFilesMock: Mock<(...args: any[]) => any>;
let readMock: Mock<(...args: any[]) => any>;
let modifyMock: Mock<(...args: any[]) => any>;
let onMockVault: Mock<(...args: any[]) => any>;
// Add other vault method mocks here if needed, e.g.:
// let createFolderMock: Mock<(...args: any[]) => any>;

let onLayoutReadyMock: Mock<(...args: any[]) => any>;
let onMockWorkspace: Mock<(...args: any[]) => any>;
let getActiveFileMock: Mock<(...args: any[]) => any>;
let detachLeavesOfTypeMock: Mock<(...args: any[]) => any>;
// Add other workspace method mocks here if needed, e.g.:
// let getLeavesOfTypeMock: Mock<(...args: any[]) => any>;

let onMockMetadataCache: Mock<(...args: any[]) => any>;
let getFileCacheMock: Mock<(...args: any[]) => any>;

describe('Integration Tests', () => {
  let plugin: ObsidianMagicPlugin;
  let appInstanceFromMock: App; // To hold the instance from the mocked App constructor
  const testManifest: PluginManifest = {
    // Define a manifest
    id: 'test-plugin-id',
    name: 'Test Plugin',
    version: '0.1.0',
    minAppVersion: '0.15.0',
    description: 'A test plugin.',
    author: 'Test Author',
    authorUrl: 'https://example.com',
    isDesktopOnly: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIpcRendererInvoke.mockClear(); // Clear specific mock

    // appInstanceFromMock will be an instance of the App from __mocks__/obsidian.ts
    appInstanceFromMock = new App();

    // Assign mocks from the appInstanceFromMock to the module-scoped variables
    // This step is to keep the rest of the test logic (that uses these variables) unchanged.
    // Ideally, tests would directly use vi.mocked(appInstanceFromMock.vault.read).mockXYZ(...)
    getMarkdownFilesMock = vi.mocked(appInstanceFromMock.vault.getMarkdownFiles);
    readMock = vi.mocked(appInstanceFromMock.vault.read);
    modifyMock = vi.mocked(appInstanceFromMock.vault.modify);
    onMockVault = vi.mocked(appInstanceFromMock.vault.on);

    onLayoutReadyMock = vi.mocked(appInstanceFromMock.workspace.onLayoutReady);
    getActiveFileMock = vi.mocked(appInstanceFromMock.workspace.getActiveFile);
    detachLeavesOfTypeMock = vi.mocked(appInstanceFromMock.workspace.detachLeavesOfType);
    onMockWorkspace = vi.mocked(appInstanceFromMock.workspace.on);

    getFileCacheMock = vi.mocked(appInstanceFromMock.metadataCache.getFileCache);
    onMockMetadataCache = vi.mocked(appInstanceFromMock.metadataCache.on);

    // Configure the individual mock functions directly
    getMarkdownFilesMock.mockReturnValue([
      { path: 'file1.md', basename: 'file1', extension: 'md' },
      { path: 'file2.md', basename: 'file2', extension: 'md' },
    ] as TFile[]);

    // Also set up the vault's getMarkdownFiles method directly on the app instance
    vi.mocked(appInstanceFromMock.vault).getMarkdownFiles.mockReturnValue([
      { path: 'file1.md', basename: 'file1', extension: 'md' },
      { path: 'file2.md', basename: 'file2', extension: 'md' },
    ] as TFile[]);
    readMock.mockImplementation((file: TFile) => {
      if (file.path === 'file1.md') return Promise.resolve('---\ntags: [existing-tag-1]\n---\nContent1');
      return Promise.resolve('Content2');
    });
    modifyMock.mockResolvedValue(undefined);
    onMockVault.mockReturnValue({ unsubscribe: vi.fn() });

    onLayoutReadyMock.mockImplementation((cb) => cb());
    getActiveFileMock.mockReturnValue({ path: 'test/document.md', basename: 'doc', extension: 'md' } as TFile);
    detachLeavesOfTypeMock.mockImplementation(vi.fn()); // Ensure it's a fresh mock
    onMockWorkspace.mockReturnValue({ unsubscribe: vi.fn() });

    getFileCacheMock.mockImplementation((file: TFile) => {
      if (file.path === 'file1.md') return { frontmatter: { tags: ['existing-tag-1'] } };
      return {};
    });
    onMockMetadataCache.mockReturnValue({ unsubscribe: vi.fn() });

    plugin = new ObsidianMagicPlugin(appInstanceFromMock, testManifest);

    // Mock loadData and saveData on the plugin instance
    plugin.loadData = vi.fn().mockResolvedValue({}); // Default settings or specific test settings
    plugin.saveData = vi.fn().mockResolvedValue(undefined);

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
      expect(apiCallContent).toContain('Content1'); // Adjusted for new mock content

      // Check the result
      expect(result.isOk()).toBe(true);

      // Verify file was modified with tags
      expect(modifyMock).toHaveBeenCalled();
      const modifyCalls = modifyMock.mock.calls;
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
      readMock.mockResolvedValueOnce('# Test Document\n\nNo frontmatter here.');
      getFileCacheMock.mockReturnValueOnce({});

      const mockFile = {
        path: 'no-frontmatter.md',
        basename: 'no-frontmatter',
        extension: 'md',
      } as TFile;

      // Process the file
      await plugin.taggingService.processFile(mockFile);

      // Verify file was modified with new frontmatter
      expect(modifyMock).toHaveBeenCalled();
      const modifyCalls = modifyMock.mock.calls;
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
      expect(modifyMock).not.toHaveBeenCalled();
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

      getMarkdownFilesMock.mockReturnValue(mockFiles);

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

      getMarkdownFilesMock.mockReturnValue(allFiles.filter((f) => f.extension === 'md') as TFile[]);

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

    it('should load API key from appropriate storage', () => {
      // Test loading from local
      plugin.settings.apiKeyStorage = 'local';
      plugin.settings.apiKey = 'local-key';

      let key = plugin.keyManager.loadKey();
      expect(key).toBe('local-key');

      // Test loading from system
      plugin.settings.apiKeyStorage = 'system';
      plugin.settings.apiKey = '';

      key = plugin.keyManager.loadKey();
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
      vi.spyOn(newPlugin, 'registerView');
      vi.spyOn(newPlugin, 'addCommand');
      vi.spyOn(newPlugin, 'addRibbonIcon'); // For settings test
      vi.spyOn(newPlugin, 'addStatusBarItem'); // For settings test

      // Re-run onload with spies attached
      await newPlugin.onload();

      expect(newPlugin.registerView).toHaveBeenCalledTimes(2);
      expect(newPlugin.addCommand).toHaveBeenCalledTimes(4);
    });

    it('should clean up resources on unload', async () => {
      // Create and load a plugin
      const newPlugin = new ObsidianMagicPlugin(new App(), testManifest); // Use new App() for fresh instance
      newPlugin.loadData = vi.fn().mockResolvedValue({});
      vi.spyOn(newPlugin, 'registerView');
      vi.spyOn(newPlugin, 'addCommand');
      vi.spyOn(newPlugin, 'addRibbonIcon');
      vi.spyOn(newPlugin, 'addStatusBarItem');
      await newPlugin.onload();

      // Unload the plugin
      newPlugin.onunload();

      // Verify resources were cleaned up
      // detachLeavesOfTypeMock is associated with appInstanceFromMock, so this check might be tricky
      // if newPlugin.app is a different instance. It should be: newPlugin.app.workspace.detachLeavesOfType
      expect(vi.mocked(newPlugin.app.workspace.detachLeavesOfType)).toHaveBeenCalledTimes(2);
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

      const newPlugin = new ObsidianMagicPlugin(new App(), testManifest); // Use new App() for fresh instance
      newPlugin.loadData = vi.fn().mockResolvedValue(mockSettings);
      // Spy on methods that would be affected by settings
      vi.spyOn(newPlugin, 'addRibbonIcon');
      vi.spyOn(newPlugin, 'addStatusBarItem');

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
