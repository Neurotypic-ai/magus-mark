import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocumentTagService } from './DocumentTagService';

import type { EditorView } from '@codemirror/view';
import type { TFile } from 'obsidian';
import type { Mock } from 'vitest';

import type MagusMarkPlugin from '../main';

// Define interface for mocking the plugin
interface MockMagusMarkPlugin {
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
    defaultTagBehavior: string; // Using string instead of TagBehavior to avoid import issues
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

  // Define the mock plugin object with spies *first*
  const mockPlugin: MockMagusMarkPlugin = {
    app: {
      vault: {
        read: vi.fn().mockResolvedValue('# Test Document\nHello world with #tag1 and #tag2'),
        modify: vi.fn().mockResolvedValue(undefined),
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      },
      workspace: {
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      },
      metadataCache: {
        getFileCache: vi.fn().mockReturnValue({
          frontmatter: {
            tags: ['existing-tag-1', 'existing-tag-2'],
          },
        }),
      },
    },
    registerEditorExtension: vi.fn(), // Ensure this is a spy
    registerEvent: vi.fn(), // Ensure this is a spy
    settings: {
      enableAutoSync: true,
      defaultTagBehavior: 'merge',
    },
    taggingService: {
      processFile: vi.fn().mockResolvedValue({ success: true }),
    },
  };

  beforeEach(() => {
    // Clear mocks *before* instantiation if needed, though usually done in afterEach
    vi.clearAllMocks();

    // Instantiate the service with the fully mocked plugin
    documentTagService = new DocumentTagService(mockPlugin as unknown as MagusMarkPlugin);

    // Reset mocks *after* instantiation if setup calls happen in constructor
    // vi.clearAllMocks(); // Usually better in afterEach

    // Default mock content for vault read (can be overridden in tests)
    mockPlugin.app.vault.read.mockResolvedValue(`---
title: Test Document
tags: [existing-tag-1, existing-tag-2]
---

# Test Document

This is a test document content.`);
  });

  afterEach(() => {
    vi.resetAllMocks(); // Use resetAllMocks to clear state between tests
  });

  it('should register editor extensions on initialization', () => {
    // The constructor should have called this
    expect(mockPlugin.registerEditorExtension).toHaveBeenCalled();
  });

  it('should register event handlers on initialization', () => {
    // The constructor should have called this
    expect(mockPlugin.registerEvent).toHaveBeenCalled();
  });

  it('should extract tags from editor content', () => {
    // Create a minimal mock of EditorView
    const mockEditor = {
      state: {
        doc: {
          toString: () => '# Test Document\nHello world with #tag1 and #tag2',
        },
      },
    } as unknown as EditorView;

    const tags = documentTagService.getTagsFromEditor(mockEditor);

    expect(tags).toContain('#tag1');
    expect(tags).toContain('#tag2');
    expect(tags.length).toBe(2);
  });

  it('should add a tag to frontmatter when frontmatter exists with tags', async () => {
    const fileWithFrontmatter: MockTFile = {
      path: 'test.md',
      extension: 'md',
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
      extension: 'md',
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
      extension: 'md',
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
