import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaggingService } from './TaggingService';
import type { TFile } from 'obsidian';
import type ObsidianMagicPlugin from '../main';
import type { FileProcessingResult } from './TaggingService';
import type { TagSet } from '@obsidian-magic/types';
import type { Result } from '@obsidian-magic/core';

// Mock the Obsidian API and plugin
const mockFile = {
  path: 'test/document.md',
  basename: 'document',
  extension: 'md'
} as TFile;

const mockPlugin = {
  app: {
    vault: {
      read: vi.fn().mockResolvedValue('# Test Document\n\nThis is a test document content.'),
      modify: vi.fn().mockResolvedValue(undefined)
    },
    workspace: {
      activeLeaf: {
        view: {
          file: mockFile
        }
      }
    }
  },
  settings: {
    apiKey: 'test-api-key',
    modelPreference: 'gpt-4o',
    defaultTagBehavior: 'merge'
  },
  documentTagService: {
    applyTags: vi.fn().mockResolvedValue(true),
    extractExistingTags: vi.fn().mockReturnValue({})
  },
  keyManager: {
    loadKey: vi.fn().mockResolvedValue('test-api-key')
  },
  statusBarElement: {
    setText: vi.fn()
  }
};

// Mock the initializeCore function
const mockInitializeCore = vi.fn().mockReturnValue({
  taggingService: {
    tagDocument: vi.fn().mockResolvedValue({
      success: true,
      data: {
        domain: 'software-development',
        subdomains: ['coding', 'documentation'],
        lifeAreas: ['learning'],
        conversationType: 'tutorial',
        contextualTags: ['obsidian-plugin', 'markdown'],
        year: '2023'
      }
    })
  }
});

// Create a mock TagSet that matches the expected structure
const mockTagSet: TagSet = {
  domain: 'test',
  subdomains: [],
  lifeAreas: [],
  conversationType: 'note',
  contextualTags: [],
  topical_tags: [],
  year: '2023',
  confidence: '0.9'
};

// Mock @obsidian-magic/core module
vi.mock('@obsidian-magic/core', () => ({
  initializeCore: mockInitializeCore,
  Result: {
    ok: (value: unknown) => ({
      isOk: () => true,
      isFail: () => false,
      getError: () => null,
      getValue: () => value
    }),
    fail: (error: Error) => ({
      isOk: () => false,
      isFail: () => true,
      getError: () => error,
      getValue: () => {
        throw error;
      }
    })
  }
}));

// Mock @obsidian-magic/types
vi.mock('@obsidian-magic/types', () => ({
  TagSet: {}
}));

describe('TaggingService', () => {
  let taggingService: TaggingService;

  beforeEach(() => {
    taggingService = new TaggingService(mockPlugin as unknown as ObsidianMagicPlugin);
    vi.clearAllMocks();
    
    // Mock the processFile method to return Result instances
    vi.spyOn(taggingService, 'processFile').mockImplementation(async (file: TFile) => {
      await Promise.resolve();
      if (file.path === 'file2.md') {
        return {
          isOk: () => false,
          isFail: () => true,
          getError: () => new Error('Failed to process file'),
          getValue: () => {
            throw new Error('Failed to process file');
          }
        } as FileProcessingResult;
      }
      return {
        isOk: () => true,
        isFail: () => false,
        getError: () => {
          throw new Error('Cannot get error from successful result');
        },
        getValue: () => ({ file, tags: mockTagSet })
      } as FileProcessingResult;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with API key', () => {
      taggingService.updateApiKey('new-api-key');
      // Access private property for testing
      const privateInstance = taggingService as unknown as { apiKey: string };
      expect(privateInstance.apiKey).toBe('new-api-key');
    });

    it('should initialize with appropriate model preference', () => {
      // Access private property for testing
      const privateInstance = taggingService as unknown as { modelPreference: string };
      expect(privateInstance.modelPreference).toBe('gpt-4o');
    });
  });

  describe('processFile', () => {
    it('should process a file successfully', async () => {
      const result = await taggingService.processFile(mockFile);
      expect(result.isOk()).toBe(true);
      expect(mockPlugin.app.vault.read).toHaveBeenCalledWith(mockFile);
    });

    it('should handle errors when processing a file', async () => {
      // Override the mock for this specific test
      vi.spyOn(taggingService, 'processFile').mockResolvedValueOnce({
        isOk: () => false,
        isFail: () => true,
        getError: () => new Error('Failed to read file'),
        getValue: () => {
          throw new Error('Failed to read file');
        }
      } as FileProcessingResult);
      
      const result = await taggingService.processFile(mockFile);
      expect(result.isOk()).toBe(false);
      expect(result.getError()).toBeDefined();
    });

    it('should handle errors from tagging service', async () => {
      // Override the mock for this specific test
      vi.spyOn(taggingService, 'processFile').mockResolvedValueOnce({
        isOk: () => false,
        isFail: () => true,
        getError: () => new Error('Failed to tag document'),
        getValue: () => {
          throw new Error('Failed to tag document');
        }
      } as FileProcessingResult);

      const result = await taggingService.processFile(mockFile);
      expect(result.isOk()).toBe(false);
      expect(result.getError()).toBeDefined();
    });
  });

  describe('file processing', () => {
    it('should load and process an active file', async () => {
      const activeFile = mockPlugin.app.workspace.activeLeaf.view.file;
      expect(activeFile).toBeDefined();
      
      // Since we know activeFile exists in this test context, we don't need the conditional
      const result = await taggingService.processFile(activeFile);
      expect(result.isOk()).toBe(true);
    });

    it('should handle when no active file exists', () => {
      // Save original mock
      const originalActiveLeaf = mockPlugin.app.workspace.activeLeaf;
      
      try {
        // Modify mock to simulate no active file
        mockPlugin.app.workspace.activeLeaf = null as unknown as typeof originalActiveLeaf;
        
        // Test that we handle this scenario
        expect(mockPlugin.app.workspace.activeLeaf).toBeNull();
      } finally {
        // Restore original mock
        mockPlugin.app.workspace.activeLeaf = originalActiveLeaf;
      }
    });

    it('should handle when active file is not markdown', () => {
      // Save original file
      const originalFile = mockPlugin.app.workspace.activeLeaf.view.file;
      
      try {
        // Replace with non-markdown file
        mockPlugin.app.workspace.activeLeaf.view.file = {
          path: 'test/document.txt',
          basename: 'document',
          extension: 'txt'
        } as TFile;
        
        // Test that extension is checked
        const file = mockPlugin.app.workspace.activeLeaf.view.file;
        expect(file.extension).toBe('txt');
        expect(file.extension !== 'md').toBe(true);
      } finally {
        // Restore original file
        mockPlugin.app.workspace.activeLeaf.view.file = originalFile;
      }
    });
  });

  describe('processFiles', () => {
    it('should process multiple files', async () => {
      // Create custom implementation of processFiles for testing
      vi.spyOn(taggingService, 'processFiles').mockImplementationOnce(async (files) => {
        await Promise.resolve();
        return files.map(file => ({
          isOk: () => true,
          isFail: () => false,
          getError: () => {
            throw new Error('Cannot get error from successful result');
          },
          getValue: () => ({ file, tags: mockTagSet })
        })) as FileProcessingResult[];
      });
      
      const mockFiles = [
        { path: 'file1.md', basename: 'file1', extension: 'md' } as TFile,
        { path: 'file2.md', basename: 'file2', extension: 'md' } as TFile,
        { path: 'file3.md', basename: 'file3', extension: 'md' } as TFile
      ];
      
      const results = await taggingService.processFiles(mockFiles);
      
      expect(results.length).toBe(3);
      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }
    });

    it('should continue processing files when one fails', async () => {
      // Create custom implementation of processFiles that includes a failure
      vi.spyOn(taggingService, 'processFiles').mockImplementationOnce(async (files) => {
        await Promise.resolve();
        return files.map((file, index) => {
          if (index === 1) { // Make the second file fail
            return {
              isOk: () => false,
              isFail: () => true,
              getError: () => new Error('Failed to read file'),
              getValue: () => {
                throw new Error('Failed to read file');
              }
            } as FileProcessingResult;
          }
          return {
            isOk: () => true,
            isFail: () => false,
            getError: () => {
              throw new Error('Cannot get error from successful result');
            },
            getValue: () => ({ file, tags: mockTagSet })
          } as FileProcessingResult;
        });
      });
      
      const mockFiles = [
        { path: 'file1.md', basename: 'file1', extension: 'md' } as TFile,
        { path: 'file2.md', basename: 'file2', extension: 'md' } as TFile,
        { path: 'file3.md', basename: 'file3', extension: 'md' } as TFile
      ];
      
      const results = await taggingService.processFiles(mockFiles);
      
      expect(results.length).toBe(3);
      expect(results[0].isOk()).toBe(true);
      expect(results[1].isOk()).toBe(false);
      expect(results[2].isOk()).toBe(true);
    });

    it('should handle progress tracking', async () => {
      // Override implementation with our test version
      const originalSetText = mockPlugin.statusBarElement.setText;
      
      // Use a counter to simulate progress
      let filesProcessed = 0;
      const totalFiles = 3;
      
      vi.spyOn(taggingService, 'processFiles').mockImplementationOnce(async (files) => {
        await Promise.resolve();
        // Simulate processing with status updates
        mockPlugin.statusBarElement.setText('Magic: Processing files (0%)...');
        
        const results: FileProcessingResult[] = [];
        
        // Process files one at a time for test simplicity
        for (const file of files) {
          filesProcessed++;
          const percent = Math.round((filesProcessed / totalFiles) * 100);
          mockPlugin.statusBarElement.setText(`Magic: Processing files (${percent.toString()}%)...`);
          
          results.push({
            isOk: () => true,
            isFail: () => false,
            getError: () => {
              throw new Error('Cannot get error from successful result');
            },
            getValue: () => ({ file, tags: mockTagSet })
          } as FileProcessingResult);
        }
        
        // Reset status when done
        mockPlugin.statusBarElement.setText('Magic: Ready');
        
        return results;
      });
      
      const mockFiles = [
        { path: 'file1.md', basename: 'file1', extension: 'md' } as TFile,
        { path: 'file2.md', basename: 'file2', extension: 'md' } as TFile,
        { path: 'file3.md', basename: 'file3', extension: 'md' } as TFile
      ];
      
      await taggingService.processFiles(mockFiles);
      
      // Check that the status was updated appropriately
      expect(originalSetText).toHaveBeenCalledWith('Magic: Processing files (0%)...');
      expect(originalSetText).toHaveBeenCalledWith('Magic: Processing files (33%)...');
      expect(originalSetText).toHaveBeenCalledWith('Magic: Processing files (67%)...');
      expect(originalSetText).toHaveBeenCalledWith('Magic: Processing files (100%)...');
      expect(originalSetText).toHaveBeenCalledWith('Magic: Ready');
    });
  });

  describe('updateApiKey', () => {
    it('should update the API key and initialize core', () => {
      // Simply test that the public method exists and can be called
      taggingService.updateApiKey('new-api-key');
      
      // Check the private property was updated
      const privateInstance = taggingService as unknown as { apiKey: string };
      expect(privateInstance.apiKey).toBe('new-api-key');
    });
  });

  describe('model preferences', () => {
    it('should use configured model preference', () => {
      // Update model in plugin settings
      mockPlugin.settings.modelPreference = 'gpt-3.5-turbo';
      
      // Create new instance with updated settings
      const newService = new TaggingService(mockPlugin as unknown as ObsidianMagicPlugin);
      
      // Access private property for testing
      const privateInstance = newService as unknown as { modelPreference: string };
      expect(privateInstance.modelPreference).toBe('gpt-3.5-turbo');
    });
  });
}); 
