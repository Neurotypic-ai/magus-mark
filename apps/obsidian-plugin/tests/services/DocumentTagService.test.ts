import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentTagService } from '../../src/services/DocumentTagService';
import type { EditorView } from '@codemirror/view';
import type { TFile } from 'obsidian';
import type { Mock } from 'vitest';
import type ObsidianMagicPlugin from '../../src/main';

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
  };
  registerEditorExtension: Mock;
  registerEvent: Mock;
  settings: {
    enableAutoSync: boolean;
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
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
      },
      workspace: {
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
      }
    },
    registerEditorExtension: vi.fn(),
    registerEvent: vi.fn(),
    settings: {
      enableAutoSync: true
    },
    taggingService: {
      processFile: vi.fn().mockResolvedValue({ success: true })
    }
  };

  beforeEach(() => {
    documentTagService = new DocumentTagService(mockPlugin as unknown as ObsidianMagicPlugin);
    vi.clearAllMocks();
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
}); 
