import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentTagService } from '../../src/services/DocumentTagService';
import { EditorView } from '@codemirror/view';

describe('DocumentTagService', () => {
  let documentTagService: DocumentTagService;
  
  const mockPlugin = {
    app: {
      vault: {
        read: vi.fn().mockResolvedValue('# Test Document\nHello world with #tag1 and #tag2'),
        modify: vi.fn().mockResolvedValue(undefined)
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
    documentTagService = new DocumentTagService(mockPlugin as any);
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
    const fileWithFrontmatter = {
      path: 'test.md'
    };
    
    mockPlugin.app.vault.read.mockResolvedValueOnce(`---
title: Test
tags: [existing]
---
# Content`);

    await documentTagService.addTagToFrontmatter(fileWithFrontmatter as any, 'newtag');
    
    expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
    const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
    expect(modifiedContent).toContain('tags: [existing, newtag]');
  });
  
  it('should add a tag to frontmatter when frontmatter exists without tags', async () => {
    const fileWithFrontmatter = {
      path: 'test.md'
    };
    
    mockPlugin.app.vault.read.mockResolvedValueOnce(`---
title: Test
---
# Content`);

    await documentTagService.addTagToFrontmatter(fileWithFrontmatter as any, 'newtag');
    
    expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
    const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
    expect(modifiedContent).toContain('tags: [newtag]');
  });
  
  it('should add frontmatter with tag when no frontmatter exists', async () => {
    const fileWithoutFrontmatter = {
      path: 'test.md'
    };
    
    mockPlugin.app.vault.read.mockResolvedValueOnce('# Content without frontmatter');

    await documentTagService.addTagToFrontmatter(fileWithoutFrontmatter as any, 'newtag');
    
    expect(mockPlugin.app.vault.modify).toHaveBeenCalled();
    const modifiedContent = mockPlugin.app.vault.modify.mock.calls[0][1];
    expect(modifiedContent).toContain('---\ntags: [newtag]\n---');
  });
}); 