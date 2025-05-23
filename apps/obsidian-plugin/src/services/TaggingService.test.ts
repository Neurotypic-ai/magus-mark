import { App, MetadataCache, TFile, Vault } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Ensures __mocks__/obsidian.ts is used

import { initializeCore } from '@magus-mark/core'; // Will import the mocked version
import { APIError } from '@magus-mark/core/errors/APIError';
import { ApiKeyError } from '@magus-mark/core/errors/ApiKeyError';
import { TaggingError } from '@magus-mark/core/errors/TaggingError';

import ObsidianMagicPlugin from '../main'; // This will be the mocked constructor

import { TaggingService } from './TaggingService';

import type { CoreModule } from '@magus-mark/core';
import type { TagSet } from '@magus-mark/core/models/TagSet';
import type { PluginManifest } from 'obsidian';
import type { Mock } from 'vitest';

import type { FileProcessingResult } from './TaggingService';

// Mock core dependencies
const mockCoreParseDocument = vi.fn();
const mockCoreTagDocument = vi.fn();
const mockCoreUpdateDocument = vi.fn();
// Assuming loadKey is not directly called by Obsidian TaggingService,
// but API key is managed via plugin settings. If it is, it needs to be part of initializeCore mock.

vi.mock('@magus-mark/core', () => ({
  initializeCore: vi.fn(() => ({
    documentProcessor: {
      parseDocument: mockCoreParseDocument,
      updateDocument: mockCoreUpdateDocument,
    },
    taggingService: {
      // This is the CORE tagging service
      tagDocument: mockCoreTagDocument,
    },
    // openAIClient: { /* mock methods if needed */ },
    // taxonomyManager: { /* mock methods if needed */ },
    // batchProcessingService: { /* mock methods if needed */ },
  })),
}));

vi.mock('../main'); // Mocks ObsidianMagicPlugin
vi.mock('obsidian');

// --- Tests ---
describe('TaggingService', () => {
  let taggingService: TaggingService;
  let pluginInstance: ObsidianMagicPlugin;
  let mockCoreServices: CoreModule; // To hold the mocked core services

  beforeEach(() => {
    vi.resetAllMocks();

    // Initialize mocked core services
    // initializeCore is already mocked to return the desired structure
    mockCoreServices = initializeCore({});

    // Configure imported mock functions from core
    mockCoreParseDocument.mockReturnValue({ path: 'test.md', name: 'test', content: '# Test Content' });
    // mockCoreTagDocument and mockCoreUpdateDocument will often be configured per test

    const MockedPlugin = ObsidianMagicPlugin as unknown as new (
      app: App,
      manifest: PluginManifest
    ) => ObsidianMagicPlugin;
    pluginInstance = new MockedPlugin({} as App, {} as PluginManifest);

    pluginInstance.app = {
      vault: {
        read: vi.fn().mockResolvedValue('# Test Content'),
        modify: vi.fn().mockResolvedValue(undefined),
      } as unknown as Vault,
      metadataCache: {} as MetadataCache,
    } as App;

    pluginInstance.settings = {
      apiKey: 'test-key', // This is the plugin's API key setting
      defaultTags: {},
    } as any;

    pluginInstance.statusBarElement = {
      setText: vi.fn(),
    } as any;

    // The TaggingService under test uses the pluginInstance, which internally might use core services.
    // For this test, we are primarily testing the Obsidian TaggingService's logic,
    // and its interactions with the Obsidian plugin instance and its direct dependencies.
    // The actual calls to core services will go through the mocks defined above if TaggingService was using them directly.
    // However, the current TaggingService seems to use plugin.core.taggingService.tagDocument etc.
    // So we need to ensure pluginInstance.core is set up with our mocks.

    // This is crucial: ensure the plugin instance used by TaggingService has the mocked core services.
    // If TaggingService constructor itself calls initializeCore, that's covered by the top-level vi.mock.
    // If TaggingService expects plugin.core to be set, we need to set it.
    // Assuming TaggingService gets `core` via `plugin.core` or similar.
    // Let's simulate that the plugin initializes its `core` property.
    (pluginInstance as any).core = mockCoreServices;

    taggingService = new TaggingService(pluginInstance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Test Cases ---

  describe('processFile', () => {
    const mockFile = { path: 'test.md', basename: 'test' } as TFile;
    const mockTags: TagSet = { year: '2024', topical_tags: [], conversation_type: 'note', confidence: { overall: 1 } };
    const mockTaggingResult = { success: true, tags: mockTags };

    it('should process a file successfully', async () => {
      // Set up notice subscription to capture messages
      const noticeMessages: string[] = [];
      taggingService.notice.subscribe((message) => noticeMessages.push(message));

      // Now, mockCoreTagDocument is what the *core* tagging service would do.
      // The Obsidian TaggingService uses this via pluginInstance.core.taggingService.tagDocument
      mockCoreTagDocument.mockResolvedValue(mockTaggingResult);
      mockCoreUpdateDocument.mockReturnValue('new file content');

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(pluginInstance.app.vault.read).toHaveBeenCalledWith(mockFile);
      // Assuming the Obsidian TaggingService calls the core documentProcessor for parsing
      expect(mockCoreParseDocument).toHaveBeenCalledWith(mockFile.path, mockFile.basename, '# Test Content');
      expect(mockCoreTagDocument).toHaveBeenCalled(); // Core tagging service
      expect(mockCoreUpdateDocument).toHaveBeenCalledWith(expect.anything(), mockTags); // Core document processor
      expect(pluginInstance.app.vault.modify).toHaveBeenCalledWith(mockFile, 'new file content');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getValue().file).toBe(mockFile);
        expect(result.getValue().tags).toEqual(mockTags);
      }
      expect(noticeMessages).toContain('Successfully tagged document');
    });

    it('should handle API errors during processing', async () => {
      // Set up notice subscription to capture messages
      const noticeMessages: string[] = [];
      taggingService.notice.subscribe((message) => noticeMessages.push(message));

      const apiError = new APIError('API Failed');
      mockCoreTagDocument.mockResolvedValue({ success: false, error: apiError });

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.getError()).toBeInstanceOf(TaggingError); // The service wraps errors in TaggingError
      }
      expect(noticeMessages.some((msg) => msg.includes('API Error') || msg.includes('API Failed'))).toBe(true);
      expect(pluginInstance.app.vault.modify).not.toHaveBeenCalled();
    });

    it('should handle API key errors during processing', async () => {
      // Set up notice subscription to capture messages
      const noticeMessages: string[] = [];
      taggingService.notice.subscribe((message) => noticeMessages.push(message));

      const keyError = new ApiKeyError('Invalid Key');
      // If this error is thrown by the core tagging service
      mockCoreTagDocument.mockImplementation(() => {
        throw keyError;
      });

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.getError()).toBeInstanceOf(ApiKeyError);
      }
      expect(noticeMessages.some((msg) => msg.includes('API key missing'))).toBe(true);
      expect(pluginInstance.app.vault.modify).not.toHaveBeenCalled();
    });

    it('should handle other errors during processing', async () => {
      // Set up notice subscription to capture messages
      const noticeMessages: string[] = [];
      taggingService.notice.subscribe((message) => noticeMessages.push(message));

      const otherError = new Error('Something else went wrong');
      mockCoreTagDocument.mockResolvedValue({ success: false, error: otherError });

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.getError()).toBeInstanceOf(TaggingError); // The Obsidian service wraps it
      }
      expect(
        noticeMessages.some((msg) => msg.includes('Tagging error') || msg.includes('Error tagging document'))
      ).toBe(true);
      expect(pluginInstance.app.vault.modify).not.toHaveBeenCalled();
    });

    it('should return error if service is not configured (no API key on plugin)', async () => {
      // This test focuses on the Obsidian TaggingService's own API key check,
      // which relies on pluginInstance.settings.apiKey.
      pluginInstance.settings.apiKey = ''; // Simulate no API key on the plugin

      const unconfiguredService = new TaggingService(pluginInstance); // Re-init with modified plugin

      const result: FileProcessingResult = await unconfiguredService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        const error = result.getError();
        expect(error).toBeInstanceOf(ApiKeyError);
        expect(error.message).toContain('OpenAI API key is not configured');
      }
      expect(mockCoreTagDocument).not.toHaveBeenCalled();
      expect(pluginInstance.app.vault.modify).not.toHaveBeenCalled();
    });
  });

  describe('processFiles', () => {
    const mockFiles = [
      { path: 'file1.md', basename: 'file1' },
      { path: 'file2.md', basename: 'file2' },
    ] as TFile[];
    const mockTags: TagSet = { year: '2024', topical_tags: [], conversation_type: 'note', confidence: { overall: 1 } };
    const mockTaggingResult = { success: true, tags: mockTags };

    beforeEach(() => {
      (pluginInstance.app.vault.read as Mock).mockResolvedValue('# Content');
      mockCoreParseDocument.mockImplementation((path: string, name: string, content: string) => ({
        path,
        name,
        content,
      }));
      mockCoreTagDocument.mockResolvedValue(mockTaggingResult);
      mockCoreUpdateDocument.mockReturnValue(
        `---
tags: processed
---
# Content`
      );
      (pluginInstance.app.vault.modify as Mock).mockResolvedValue(undefined);

      if (!pluginInstance.statusBarElement) {
        pluginInstance.statusBarElement = { setText: vi.fn() } as any;
      } else {
        (pluginInstance.statusBarElement.setText as Mock).mockClear();
      }
    });

    it('should process multiple files and report progress', async () => {
      await taggingService.processFiles(mockFiles);

      expect(mockCoreTagDocument).toHaveBeenCalledTimes(mockFiles.length);
      if (pluginInstance.statusBarElement) {
        expect(pluginInstance.statusBarElement.setText).toHaveBeenCalledWith('Magic: Processing files (50%)...');
        expect(pluginInstance.statusBarElement.setText).toHaveBeenCalledWith('Magic: Processing files (100%)...');
        expect(pluginInstance.statusBarElement.setText).toHaveBeenCalledWith('Magic: Ready');
      }
    });

    it('should collect results for each file', async () => {
      const results = await taggingService.processFiles(mockFiles);

      expect(results).toHaveLength(mockFiles.length);
      results.forEach((result: FileProcessingResult, index: number) => {
        expect(result.isOk()).toBe(true);
        if (result.isOk() && mockFiles[index]) {
          expect(result.getValue().file.path).toBe(mockFiles[index].path);
          expect(result.getValue().tags).toEqual(mockTags);
        }
      });
    });

    it('should handle errors for individual files', async () => {
      // Set up notice subscription to capture messages
      const noticeMessages: string[] = [];
      taggingService.notice.subscribe((message) => noticeMessages.push(message));

      const errorFile = { path: 'error.md', basename: 'error' } as TFile;
      const firstMockFile = mockFiles[0];
      const secondMockFile = mockFiles[1];

      if (firstMockFile === undefined || secondMockFile === undefined) {
        throw new Error('Test setup error: mockFiles should contain at least two elements.');
      }
      const filesWithError = [firstMockFile, errorFile, secondMockFile];
      const fileError = new Error('File processing error');

      mockCoreTagDocument
        .mockResolvedValueOnce(mockTaggingResult)
        .mockResolvedValueOnce({ success: false, error: fileError })
        .mockResolvedValueOnce(mockTaggingResult);

      const results = await taggingService.processFiles(filesWithError);

      expect(results).toHaveLength(filesWithError.length);
      expect(results[0]?.isOk()).toBe(true);
      expect(results[1]?.isFail()).toBe(true);
      if (results[1]?.isFail()) {
        expect(results[1].getError()).toBeInstanceOf(TaggingError);
      }
      expect(results[2]?.isOk()).toBe(true);
      expect(
        noticeMessages.some((msg) => msg.includes('Tagging error') || msg.includes('Error tagging document'))
      ).toBe(true);
    });

    it('should return errors if service is not configured', async () => {
      pluginInstance.settings.apiKey = ''; // Simulate no API key on the plugin
      const unconfiguredService = new TaggingService(pluginInstance); // Re-init

      const results = await unconfiguredService.processFiles(mockFiles);

      expect(results).toHaveLength(mockFiles.length);
      results.forEach((result: FileProcessingResult) => {
        expect(result.isFail()).toBe(true);
        if (result.isFail()) {
          const error = result.getError();
          expect(error).toBeInstanceOf(ApiKeyError);
          expect(error.message).toContain('OpenAI API key is not configured');
        }
      });
      expect(mockCoreTagDocument).not.toHaveBeenCalled();
    });
  });
});
