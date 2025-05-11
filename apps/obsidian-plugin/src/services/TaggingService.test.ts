import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { APIError } from '@magus-mark/core/errors/APIError';
import { ApiKeyError } from '@magus-mark/core/errors/ApiKeyError';
import { TaggingError } from '@magus-mark/core/errors/TaggingError';

import { TaggingService } from './TaggingService';

import type { TagSet } from '@magus-mark/core/models/TagSet';
import type { TFile } from 'obsidian';

import type ObsidianMagicPlugin from '../main';
import type { FileProcessingResult } from './TaggingService';

// **** DEFINE MOCK IMPLEMENTATIONS ****
const mockTagDocument = vi.fn();
const mockParseDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockSetApiKey = vi.fn();
const mockSetModel = vi.fn();

// Mock the return value of initializeCore
const mockCoreServices = {
  openAIClient: {
    setApiKey: mockSetApiKey,
    setModel: mockSetModel,
  },
  taggingService: {
    tagDocument: mockTagDocument,
  },
  documentProcessor: {
    parseDocument: mockParseDocument,
    updateDocument: mockUpdateDocument,
  },
};

// Mock only the initializeCore function from the core module
vi.mock('@magus-mark/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@magus-mark/core')>();
  return {
    ...actual, // Keep other actual exports
    initializeCore: vi.fn().mockReturnValue(mockCoreServices), // Mock initializeCore
  };
});

// Mock KeyManager dependency
const mockLoadKey = vi.fn();
vi.mock('./KeyManager', () => ({
  KeyManager: vi.fn(() => ({
    loadKey: mockLoadKey,
  })),
}));

// Mock obsidian Notice and App Vault methods
const mockNotice = vi.fn();
const mockVaultRead = vi.fn();
const mockVaultModify = vi.fn();
vi.mock('obsidian', async (importOriginal) => {
  const original = await importOriginal<typeof import('obsidian')>();
  return {
    ...original, // Keep original exports
    Notice: mockNotice, // Mock Notice specifically
    // Mock parts of App needed
    App: {
      vault: {
        read: mockVaultRead,
        modify: mockVaultModify,
      },
    },
  };
});

// Mock plugin instance (basic structure)
const mockPlugin = {
  app: {
    vault: {
      read: mockVaultRead,
      modify: mockVaultModify,
    },
  } as any, // Using 'any' for simplicity, refine if needed
  settings: {
    apiKey: 'test-key',
    tagMode: 'overwrite',
    enableAutoSync: true,
    logLevel: 'info',
    modelPreference: 'gpt-4o', // Add model pref
    defaultTagBehavior: 'overwrite', // Add tag behavior
    // other settings...
  },
  keyManager: { loadKey: mockLoadKey } as any,
  // Simplify statusBarElement mock
  statusBarElement: { setText: vi.fn() } as any, // Use 'as any' to bypass complex type issues
} as unknown as ObsidianMagicPlugin; // Cast to allow partial mock

// --- Tests ---

describe('TaggingService', () => {
  let taggingService: TaggingService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Mock loadKey result for successful configuration by default
    mockLoadKey.mockResolvedValue('test-key');

    // Mock file reading and document parsing results (used by core mocks)
    mockVaultRead.mockResolvedValue('# Test Content');
    mockParseDocument.mockReturnValue({ path: 'test.md', name: 'test', content: '# Test Content' });

    // Create instance of the service - constructor calls mocked initializeCore
    taggingService = new TaggingService(mockPlugin);

    // No need to spyOn coreServices methods directly as initializeCore is mocked
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Test Cases ---

  // Initialize method is not public, tested implicitly

  describe('processFile', () => {
    const mockFile = { path: 'test.md', basename: 'test' } as TFile;
    const mockTags: TagSet = { year: '2024', topical_tags: [], conversation_type: 'note', confidence: { overall: 1 } }; // Example TagSet
    // Mock the return value of core tagDocument
    const mockTaggingResult = { success: true, tags: mockTags };

    it('should process a file successfully', async () => {
      mockTagDocument.mockResolvedValue(mockTaggingResult);

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(mockVaultRead).toHaveBeenCalledWith(mockFile);
      expect(mockParseDocument).toHaveBeenCalledWith(mockFile.path, mockFile.basename, '# Test Content');
      expect(mockTagDocument).toHaveBeenCalled();
      expect(mockUpdateDocument).toHaveBeenCalledWith(expect.anything(), mockTags);
      expect(mockVaultModify).toHaveBeenCalledWith(mockFile, expect.any(String));
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getValue().file).toBe(mockFile);
        expect(result.getValue().tags).toEqual(mockTags);
      }
      expect(mockNotice).toHaveBeenCalledWith('Successfully tagged document');
    });

    it('should handle API errors during processing', async () => {
      const apiError = new APIError('API Failed');
      mockTagDocument.mockResolvedValue({ success: false, error: apiError });

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.getError()).toBeInstanceOf(APIError);
      }
      expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('API Error: API Failed'));
      expect(mockVaultModify).not.toHaveBeenCalled();
    });

    it('should handle API key errors during processing', async () => {
      const keyError = new ApiKeyError('Invalid Key');
      mockTagDocument.mockImplementation(() => {
        throw keyError;
      });

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.getError()).toBeInstanceOf(ApiKeyError);
      }
      expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('API key missing'));
      expect(mockVaultModify).not.toHaveBeenCalled();
    });

    it('should handle other errors during processing', async () => {
      const otherError = new Error('Something else went wrong');
      mockTagDocument.mockResolvedValue({ success: false, error: otherError });

      const result: FileProcessingResult = await taggingService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        expect(result.getError()).toBeInstanceOf(TaggingError);
      }
      expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('Error tagging document'));
      expect(mockVaultModify).not.toHaveBeenCalled();
    });

    it('should return error if service is not configured (no API key)', async () => {
      mockLoadKey.mockResolvedValue(null);
      const unconfiguredPlugin = {
        ...mockPlugin,
        settings: { ...mockPlugin.settings, apiKey: '' },
        statusBarElement: { setText: vi.fn() } as any,
      }; // Use simplified mock
      const unconfiguredService = new TaggingService(unconfiguredPlugin as ObsidianMagicPlugin);

      const result: FileProcessingResult = await unconfiguredService.processFile(mockFile);

      expect(result.isFail()).toBe(true);
      if (result.isFail()) {
        const error = result.getError();
        expect(error).toBeInstanceOf(ApiKeyError);
        expect(error.message).toContain('OpenAI API key is not configured');
      }
      expect(mockTagDocument).not.toHaveBeenCalled();
      expect(mockVaultModify).not.toHaveBeenCalled();
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
      mockVaultRead.mockResolvedValue('# Content');
      mockParseDocument.mockImplementation((path, name, content) => ({ path, name, content }));
      mockTagDocument.mockResolvedValue(mockTaggingResult);
      mockUpdateDocument.mockReturnValue('---\ntags: processed\n---\n# Content');
      mockVaultModify.mockResolvedValue(undefined);
      vi.clearAllMocks();
      // Ensure status bar mock exists
      if (!mockPlugin.statusBarElement) {
        mockPlugin.statusBarElement = { setText: vi.fn() } as any;
      }
    });

    it('should process multiple files and report progress', async () => {
      await taggingService.processFiles(mockFiles);

      expect(mockTagDocument).toHaveBeenCalledTimes(mockFiles.length);
      // Check status bar updates - add null check
      if (mockPlugin.statusBarElement) {
        expect(mockPlugin.statusBarElement.setText).toHaveBeenCalledWith('Magic: Processing files (50%)...');
        expect(mockPlugin.statusBarElement.setText).toHaveBeenCalledWith('Magic: Processing files (100%)...');
        expect(mockPlugin.statusBarElement.setText).toHaveBeenCalledWith('Magic: Ready');
      }
    });

    it('should collect results for each file', async () => {
      const results = await taggingService.processFiles(mockFiles);

      expect(results).toHaveLength(mockFiles.length);
      // Add explicit types and check index validity
      results.forEach((result: FileProcessingResult, index: number) => {
        expect(result.isOk()).toBe(true);
        if (result.isOk() && mockFiles[index]) {
          // Ensure mockFiles[index] exists
          // Use getValue() and optional chaining for path access
          expect(result.getValue().file.path).toBe(mockFiles[index].path);
          expect(result.getValue().tags).toEqual(mockTags);
        }
      });
    });

    it('should handle errors for individual files', async () => {
      const errorFile = { path: 'error.md', basename: 'error' } as TFile;
      const filesWithError = [mockFiles[0], errorFile, mockFiles[1]];
      const fileError = new Error('File processing error');

      mockTagDocument
        .mockResolvedValueOnce(mockTaggingResult)
        .mockResolvedValueOnce({ success: false, error: fileError })
        .mockResolvedValueOnce(mockTaggingResult);

      const results = await taggingService.processFiles(filesWithError as TFile[]);

      expect(results).toHaveLength(filesWithError.length);
      expect(results[0]?.isOk()).toBe(true);
      expect(results[1]?.isFail()).toBe(true);
      if (results[1]?.isFail()) {
        expect(results[1].getError()).toBeInstanceOf(TaggingError);
      }
      expect(results[2]?.isOk()).toBe(true);
      expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('Error tagging document'));
    });

    it('should return errors if service is not configured', async () => {
      mockLoadKey.mockResolvedValue(null);
      const unconfiguredPlugin = {
        ...mockPlugin,
        settings: { ...mockPlugin.settings, apiKey: '' },
        statusBarElement: { setText: vi.fn() } as any,
      };
      const unconfiguredService = new TaggingService(unconfiguredPlugin as ObsidianMagicPlugin);

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
      expect(mockTagDocument).not.toHaveBeenCalled();
    });
  });
});
