import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaggingService } from '../../src/services/TaggingService';
import type { TFile } from 'obsidian';
import type ObsidianMagicPlugin from '../../src/main';

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
    getKey: vi.fn().mockResolvedValue('test-api-key')
  }
};

// Mock the core tagging service
vi.mock('@obsidian-magic/core', () => {
  return {
    initializeCore: vi.fn().mockReturnValue({
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
    })
  };
});

describe('TaggingService', () => {
  let taggingService: TaggingService;

  beforeEach(() => {
    taggingService = new TaggingService(mockPlugin as unknown as ObsidianMagicPlugin);
    vi.clearAllMocks();
  });

  it('should initialize with API key', () => {
    taggingService.updateApiKey('new-api-key');
    expect((taggingService as unknown as { apiKey: string }).apiKey).toBe('new-api-key');
  });

  it('should process a file successfully', async () => {
    const result = await taggingService.processFile(mockFile);
    
    expect((result as unknown as { success: boolean }).success).toBe(true);
    expect(mockPlugin.app.vault.read).toHaveBeenCalledWith(mockFile);
    expect(mockPlugin.documentTagService.applyTags).toHaveBeenCalled();
  });

  it('should handle errors when processing a file', async () => {
    mockPlugin.app.vault.read.mockRejectedValueOnce(new Error('Failed to read file'));
    
    const result = await taggingService.processFile(mockFile);
    
    expect((result as unknown as { success: boolean }).success).toBe(false);
    expect((result as unknown as { error: unknown }).error).toBeDefined();
  });
}); 
