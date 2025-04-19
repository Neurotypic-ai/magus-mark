import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockObsidianElement } from '../__mocks__/obsidian';
import { TagManagementView } from './TagManagementView';

import type { MetadataCache, Vault, WorkspaceLeaf } from 'obsidian';
import type { Mock } from 'vitest';

import type ObsidianMagicPlugin from '../main';

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
  createDiv: Mock;
  createSpan: Mock;
  setText: Mock;
}

// Mock WorkspaceLeaf more accurately for ItemView constructor
const mockLeaf = {
  view: {
    file: { path: 'mock-leaf-file.md', basename: 'mock-leaf-file', extension: 'md' },
  },
  // Add other WorkspaceLeaf properties if needed by the view constructor or tests
} as unknown as WorkspaceLeaf; // Cast remains necessary for partial mock

describe('TagManagementView', () => {
  let view: TagManagementView;
  let mockContentContainer: HTMLElement; // Reference to the actual content area

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
    // Create the view instance - relies on ItemView mock creating containerEl
    view = new TagManagementView(mockLeaf, mockPlugin);

    // Ensure containerEl and its child exist AFTER instantiation
    if (view.containerEl.children.length < 2) {
      // Use the Obsidian mock helper for all containers
      view.containerEl = createMockObsidianElement('div');
      view.containerEl.appendChild(createMockObsidianElement('div')); // Placeholder [0]
      view.containerEl.appendChild(createMockObsidianElement('div')); // Placeholder [1] for content
      console.warn('ItemView mock did not create expected container structure. Manually created.');
    }

    // Get the reference to the actual content container (children[1])
    mockContentContainer = view.containerEl.children[1] as HTMLElement;
    // No need to spyOn methods, as createMockObsidianElement already mocks them
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
    // Pre-condition check: Ensure mockContentContainer is valid before calling onOpen
    expect(mockContentContainer).toBeDefined();
    expect(mockContentContainer.empty).toBeDefined();
    expect(mockContentContainer.createEl).toBeDefined();

    await view.onOpen();

    // Assert against the spies on the *actual* content container (children[1])
    expect(vi.mocked(mockContentContainer).empty).toHaveBeenCalled();
    expect(vi.mocked(mockContentContainer).createEl).toHaveBeenCalledWith('h2', {
      text: 'Obsidian Magic Tag Management',
    });
    expect(vi.mocked(mockContentContainer).createEl).toHaveBeenCalledWith('div', 'tag-section');
    expect(vi.mocked(mockContentContainer).createEl).toHaveBeenCalledWith('div', 'actions-section');
    expect(vi.mocked(mockContentContainer).createEl).toHaveBeenCalledWith('div', 'stats-section');
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
      createDiv: vi.fn().mockReturnThis(),
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
