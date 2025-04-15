import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TagManagementView } from './TagManagementView';

import type { MetadataCache, Vault, WorkspaceLeaf } from 'obsidian';
import type { Mock } from 'vitest';

import type ObsidianMagicPlugin from '../main';

// Define interface for mocking
interface MockedWorkspaceLeaf {
  containerEl: {
    children: {
      empty?: () => void;
      createEl?: (tagName: string, options?: Record<string, unknown>) => unknown;
      createDiv?: (className?: string) => {
        createEl: (tagName: string, options?: Record<string, unknown>) => { addEventListener: Mock };
        createSpan: () => { setText: Mock };
        setText: Mock;
      };
    }[];
  };
}

// Define type for tag data
interface TagData {
  id: string;
  name: string;
  count: number;
}

// Define the shape of private methods that we need to access in tests
// This helps maintain type safety while testing private methods
interface TagManagementViewPrivates {
  getAllTags: () => TagData[];
  renderTagsList: (container: HTMLElement, filterTerm?: string) => void;
}

// Mock container for renderTagsList tests
interface MockContainer extends HTMLElement {
  empty: Mock;
  createEl: Mock;
  createSpan: Mock;
  setText: Mock;
}

// Mock WorkspaceLeaf
const mockLeaf: Partial<MockedWorkspaceLeaf> = {
  containerEl: {
    children: [
      {}, // First child (typically header)
      {
        // Content container
        empty: vi.fn(),
        createEl: vi.fn().mockReturnThis(),
        createDiv: vi.fn().mockReturnValue({
          createEl: vi.fn().mockReturnThis(),
          createDiv: vi.fn().mockReturnValue({
            createEl: vi.fn().mockReturnValue({
              addEventListener: vi.fn(),
            }),
            createSpan: vi.fn().mockReturnThis(),
            setText: vi.fn(),
          }),
        }),
      },
    ],
  },
};

describe('TagManagementView', () => {
  let view: TagManagementView;

  const mockPlugin = {
    app: {
      metadataCache: {
        getFileCache: vi.fn().mockReturnValue({
          frontmatter: { tags: ['test-tag'] },
          tags: [{ tag: '#inline-tag', position: { start: { line: 5 } } }],
        }),
      } as unknown as Partial<MetadataCache>,
      vault: {
        getMarkdownFiles: vi.fn().mockReturnValue([{ path: 'note1.md' }, { path: 'note2.md' }]),
      } as unknown as Partial<Vault>,
    },
  } as unknown as ObsidianMagicPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    view = new TagManagementView(mockLeaf as unknown as WorkspaceLeaf, mockPlugin);
  });

  it('should return the correct view type', () => {
    expect(view.getViewType()).toBe('obsidian-magic-tag-management');
  });

  it('should return the correct display text', () => {
    expect(view.getDisplayText()).toBe('Tag Management');
  });

  it('should return the correct icon', () => {
    expect(view.getIcon()).toBe('tag');
  });

  it('should render the view on open', async () => {
    await view.onOpen();

    const container = mockLeaf.containerEl?.children[1];
    if (container) {
      expect(container.empty).toHaveBeenCalled();
      expect(container.createEl).toHaveBeenCalledWith('h2', { text: 'Obsidian Magic Tag Management' });
    }
  });

  it('should collect tags from the vault', () => {
    // Using "unknown" instead of "any" with a type assertion for the private method
    const privates = view as unknown as TagManagementViewPrivates;

    // Now we can safely call the method through our typed interface
    const tags = privates.getAllTags();

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  it('should render tags list with filter', () => {
    const mockContainer = {
      empty: vi.fn(),
      createEl: vi.fn().mockReturnThis(),
      createSpan: vi.fn().mockReturnThis(),
      setText: vi.fn(),
    } as unknown as MockContainer;

    // Using "unknown" instead of "any" with a type assertion for the private method
    const privates = view as unknown as TagManagementViewPrivates;

    // Mock getAllTags to return test data
    vi.spyOn(privates, 'getAllTags').mockReturnValue([
      { id: 'tag-1', name: '#tag1', count: 3 },
      { id: 'tag-2', name: '#tag2', count: 1 },
    ]);

    // Now we can safely call the method through our typed interface
    privates.renderTagsList(mockContainer, 'tag1');

    expect(mockContainer.empty).toHaveBeenCalled();
  });
});
