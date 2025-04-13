import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentTagService } from './DocumentTagService';
import type { EditorView } from '@codemirror/view';
import type { TFile } from 'obsidian';
import type { Mock } from 'vitest';
import type ObsidianMagicPlugin from '../main';
import type { DocumentTags } from '@obsidian-magic/types';

// Define interface for mocking the plugin
interface MockObsidianMagicPlugin {
  app: {
    vault: {
      read: Mock;
      modify: Mock;
      on: Mock;
    };
    workspace: {
      on: Mock;
    };
    metadataCache: {
      getFileCache: Mock;
    };
  };
  registerEditorExtension: Mock;
  registerEvent: Mock;
  settings: {
    enableAutoSync: boolean;
    defaultTagBehavior: string;
  };
  taggingService: {
    processFile: Mock;
  };
}

// Define a mock file type
interface MockTFile {
  path: string;
  extension?: string;
}

describe('DocumentTagService', () => {
  let documentTagService: DocumentTagService;
  
  const mockPlugin: MockObsidianMagicPlugin = {
    app: {
      vault: {
        read: vi.fn().mockResolvedValue('# Test Document\nHello world with #tag1 and #tag2'),
        modify: vi.fn().mockResolvedValue(undefined),
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        metadataCache: {
          getFileCache: vi.fn().mockReturnValue({
            frontmatter: {
              tags: ['existing-tag-1', 'existing-tag-2']
            }
          })
        }
      },
      workspace: {
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
      }
    },
    registerEditorExtension: vi.fn(),
    registerEvent: vi.fn(),
    settings: {
      enableAutoSync: true,
      defaultTagBehavior: 'merge'
    },
    taggingService: {
      processFile: vi.fn().mockResolvedValue({ success: true })
    }
  };

  beforeEach(() => {
    documentTagService = new DocumentTagService(mockPlugin as unknown as ObsidianMagicPlugin);
    vi.clearAllMocks();
    
    // Default mock content
    mockPlugin.app.vault.read.mockResolvedValue(`---
title: Test Document
tags: [existing-tag-1, existing-tag-2]
---

# Test Document

This is a test document content.`);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should register editor extensions on initialization', () => {
    expect(mockPlugin.registerEditorExtension).toHaveBeenCalled();
  });

  it('should register event handlers on initialization', () => {
    expect(mockPlugin.registerEvent).toHaveBeenCalled();
  });

  it('should extract tags from editor content', () => {
    // Create a minimal mock of EditorView
    const mockEditor = {
      state: {
        doc: {
          toString: () => '# Test Document\nHello world with #tag1 and #tag2'
        }
      }
    } as unknown as EditorView;

    const tags = documentTagService.getTagsFromEditor(mockEditor);
    
    expect(tags).toContain('#tag1');
    expect(tags).toContain('#tag2');
    expect(tags.length).toBe(2);
  });

  it('should add a tag to frontmatter when frontmatter exists with tags', async () => {
    const fileWithFrontmatter: MockTFile = {
      path: 'test.md',
      extension: 'md'
    };
    
    mockPlugin.app.vault.read.mockResolvedValueOnce(`---
title: Test
tags: [existing]
---
# Content`);

    await documentTagService.addTagToFrontmatter(fileWithFrontmatter as unknown as TFile, 'newtag');
    
    expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
    
    // Type the calls array explicitly
    const calls = mockPlugin.app.vault.modify.mock.calls as unknown[][];
    expect(calls.length).toBeGreaterThan(0);
    
    // Safely access the content with type guard
    const callArg = calls[0]?.[1];
    if (typeof callArg !== 'string') {
      throw new Error('Expected second argument to be a string');
    }
    
    expect(callArg).toContain('tags: [existing, newtag]');
  });
  
  it('should add a tag to frontmatter when frontmatter exists without tags', async () => {
    const fileWithFrontmatter: MockTFile = {
      path: 'test.md',
      extension: 'md'
    };
    
    mockPlugin.app.vault.read.mockResolvedValueOnce(`---
title: Test
---
# Content`);

    await documentTagService.addTagToFrontmatter(fileWithFrontmatter as unknown as TFile, 'newtag');
    
    expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
    
    // Type the calls array explicitly
    const calls = mockPlugin.app.vault.modify.mock.calls as unknown[][];
    expect(calls.length).toBeGreaterThan(0);
    
    // Safely access the content with type guard
    const callArg = calls[0]?.[1];
    if (typeof callArg !== 'string') {
      throw new Error('Expected second argument to be a string');
    }
    
    expect(callArg).toContain('tags: [newtag]');
  });
  
  it('should add frontmatter with tag when no frontmatter exists', async () => {
    const fileWithoutFrontmatter: MockTFile = {
      path: 'test.md',
      extension: 'md'
    };
    
    mockPlugin.app.vault.read.mockResolvedValueOnce('# Content without frontmatter');

    await documentTagService.addTagToFrontmatter(fileWithoutFrontmatter as unknown as TFile, 'newtag');
    
    expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
    
    // Type the calls array explicitly
    const calls = mockPlugin.app.vault.modify.mock.calls as unknown[][];
    expect(calls.length).toBeGreaterThan(0);
    
    // Safely access the content with type guard
    const callArg = calls[0]?.[1];
    if (typeof callArg !== 'string') {
      throw new Error('Expected second argument to be a string');
    }
    
    expect(callArg).toContain('---\ntags: [newtag]\n---');
  });

  describe('extractExistingTags', () => {
    it('should extract tags from frontmatter', () => {
      const existingTags = documentTagService.extractExistingTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile);
      
      expect(existingTags).toBeDefined();
      expect(existingTags.tags).toEqual(['existing-tag-1', 'existing-tag-2']);
    });
    
    it('should handle missing frontmatter', () => {
      mockPlugin.app.metadataCache.getFileCache.mockReturnValueOnce({});
      
      const existingTags = documentTagService.extractExistingTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile);
      
      expect(existingTags).toBeDefined();
      expect(existingTags.tags).toEqual([]);
    });
    
    it('should handle missing tags in frontmatter', () => {
      mockPlugin.app.metadataCache.getFileCache.mockReturnValueOnce({
        frontmatter: { title: 'Test Document' }
      });
      
      const existingTags = documentTagService.extractExistingTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile);
      
      expect(existingTags).toBeDefined();
      expect(existingTags.tags).toEqual([]);
    });
    
    it('should handle string format tags in frontmatter', () => {
      mockPlugin.app.metadataCache.getFileCache.mockReturnValueOnce({
        frontmatter: { tags: 'single-tag' }
      });
      
      const existingTags = documentTagService.extractExistingTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile);
      
      expect(existingTags).toBeDefined();
      expect(existingTags.tags).toEqual(['single-tag']);
    });
    
    it('should handle comma-separated tags in frontmatter', () => {
      mockPlugin.app.metadataCache.getFileCache.mockReturnValueOnce({
        frontmatter: { tags: 'tag1, tag2, tag3' }
      });
      
      const existingTags = documentTagService.extractExistingTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile);
      
      expect(existingTags).toBeDefined();
      expect(existingTags.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });
  
  describe('applyTags', () => {
    const newTags: DocumentTags = {
      domain: 'software-development',
      subdomains: ['coding', 'documentation'],
      lifeAreas: ['learning'],
      conversationType: 'tutorial',
      contextualTags: ['obsidian-plugin', 'markdown'],
      year: '2023'
    };
    
    it('should merge new tags with existing ones when behavior is "merge"', async () => {
      mockPlugin.settings.defaultTagBehavior = 'merge';
      
      await documentTagService.applyTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile, newTags);
      
      // Check if vault.modify was called with the right content
      expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
      const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
      
      // Verify that the frontmatter contains both existing and new tags
      expect(modifiedContent).toContain('tags:');
      expect(modifiedContent).toContain('existing-tag-1');
      expect(modifiedContent).toContain('existing-tag-2');
      expect(modifiedContent).toContain('obsidian-plugin');
      expect(modifiedContent).toContain('markdown');
      
      // Verify that new metadata fields were added
      expect(modifiedContent).toContain('domain: software-development');
      expect(modifiedContent).toContain('subdomains:');
      expect(modifiedContent).toContain('lifeAreas:');
      expect(modifiedContent).toContain('conversationType: tutorial');
      expect(modifiedContent).toContain('year: "2023"');
    });
    
    it('should replace existing tags when behavior is "replace"', async () => {
      mockPlugin.settings.defaultTagBehavior = 'replace';
      
      await documentTagService.applyTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile, newTags);
      
      // Check if vault.modify was called with the right content
      expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
      const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
      
      // Verify that the frontmatter only contains new tags
      expect(modifiedContent).toContain('tags:');
      expect(modifiedContent).not.toContain('existing-tag-1');
      expect(modifiedContent).not.toContain('existing-tag-2');
      expect(modifiedContent).toContain('obsidian-plugin');
      expect(modifiedContent).toContain('markdown');
    });
    
    it('should preserve existing tags when behavior is "preserve"', async () => {
      mockPlugin.settings.defaultTagBehavior = 'preserve';
      
      await documentTagService.applyTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile, newTags);
      
      // Check if vault.modify was called with the right content
      expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
      const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
      
      // Verify that the frontmatter contains only existing tags
      expect(modifiedContent).toContain('tags:');
      expect(modifiedContent).toContain('existing-tag-1');
      expect(modifiedContent).toContain('existing-tag-2');
      expect(modifiedContent).not.toContain('obsidian-plugin');
      expect(modifiedContent).not.toContain('markdown');
      
      // Verify that new metadata fields were added
      expect(modifiedContent).toContain('domain: software-development');
    });
    
    it('should handle files without frontmatter', async () => {
      mockPlugin.app.vault.read.mockResolvedValueOnce('# Test Document\n\nThis is a test document content.');
      mockPlugin.app.metadataCache.getFileCache.mockReturnValueOnce({});
      
      await documentTagService.applyTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile, newTags);
      
      // Check if vault.modify was called with the right content
      expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
      const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
      
      // Verify that new frontmatter was added with tags
      expect(modifiedContent).toStartWith('---');
      expect(modifiedContent).toContain('tags:');
      expect(modifiedContent).toContain('domain: software-development');
      expect(modifiedContent).toContain('# Test Document');
    });
    
    it('should preserve other frontmatter fields', async () => {
      mockPlugin.app.vault.read.mockResolvedValueOnce(`---
title: Test Document
author: Test Author
date: 2023-01-01
tags: [existing-tag-1, existing-tag-2]
---

# Test Document

This is a test document content.`);
      
      await documentTagService.applyTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile, newTags);
      
      // Check if vault.modify was called with the right content
      expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
      const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
      
      // Verify that other frontmatter fields are preserved
      expect(modifiedContent).toContain('title: Test Document');
      expect(modifiedContent).toContain('author: Test Author');
      expect(modifiedContent).toContain('date: 2023-01-01');
    });
    
    it('should handle errors when reading file', async () => {
      mockPlugin.app.vault.read.mockRejectedValueOnce(new Error('Failed to read file'));
      
      const result = await documentTagService.applyTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile, newTags);
      
      expect(result).toBe(false);
      expect(mockPlugin.app.vault.modify).not.toHaveBeenCalled();
    });
    
    it('should handle errors when modifying file', async () => {
      mockPlugin.app.vault.modify.mockRejectedValueOnce(new Error('Failed to modify file'));
      
      const result = await documentTagService.applyTags(mockPlugin.app.metadataCache.getFileCache.mock.calls[0][0] as TFile, newTags);
      
      expect(result).toBe(false);
    });
  });
  
  describe('formatFrontmatter', () => {
    it('should format frontmatter with array tags', () => {
      const frontmatter = {
        title: 'Test Document',
        tags: ['tag1', 'tag2', 'tag3']
      };
      
      const formatted = (documentTagService as any).formatFrontmatter(frontmatter);
      
      expect(formatted).toContain('title: Test Document');
      expect(formatted).toContain('tags:');
      expect(formatted).toContain('  - tag1');
      expect(formatted).toContain('  - tag2');
      expect(formatted).toContain('  - tag3');
    });
    
    it('should format frontmatter with nested arrays', () => {
      const frontmatter = {
        title: 'Test Document',
        subdomains: ['coding', 'documentation']
      };
      
      const formatted = (documentTagService as any).formatFrontmatter(frontmatter);
      
      expect(formatted).toContain('title: Test Document');
      expect(formatted).toContain('subdomains:');
      expect(formatted).toContain('  - coding');
      expect(formatted).toContain('  - documentation');
    });
    
    it('should format frontmatter with string values', () => {
      const frontmatter = {
        title: 'Test Document',
        domain: 'software-development'
      };
      
      const formatted = (documentTagService as any).formatFrontmatter(frontmatter);
      
      expect(formatted).toContain('title: Test Document');
      expect(formatted).toContain('domain: software-development');
    });
    
    it('should handle numeric values in frontmatter', () => {
      const frontmatter = {
        title: 'Test Document',
        year: 2023
      };
      
      const formatted = (documentTagService as any).formatFrontmatter(frontmatter);
      
      expect(formatted).toContain('title: Test Document');
      expect(formatted).toContain('year: 2023');
    });
  });
}); 
