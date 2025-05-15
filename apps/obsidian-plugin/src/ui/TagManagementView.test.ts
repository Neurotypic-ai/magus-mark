import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockedPlugin } from '../__mocks__/obsidian';
import { createMockObsidianElement } from '../testing/createMockObsidianElement';
import { TagManagementView } from './TagManagementView';

import type { CachedMetadata, TFile, WorkspaceLeaf } from 'obsidian';

import type { MockObsidianElement } from '../__mocks__/obsidian/MockObsidianElement';
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
  let mockPlugin: ObsidianMagicPlugin; // Changed type to allow full plugin mock

  beforeEach(() => {
    vi.clearAllMocks();

    mockPlugin = createMockedPlugin(); // Use createMockedPlugin

    // Apply specific mocks to the app, metadataCache, and vault instances from the mocked plugin
    vi.spyOn(mockPlugin.app.metadataCache, 'getFileCache').mockReturnValue({
      frontmatter: { tags: ['test-tag'] },
      tags: [{ tag: '#inline-tag', position: { start: { line: 5 } } }],
    } as unknown as CachedMetadata);
    vi.spyOn(mockPlugin.app.vault, 'getMarkdownFiles').mockReturnValue([
      { path: 'note1.md' },
      { path: 'note2.md' },
    ] as TFile[]);

    // Create the view instance
    view = new TagManagementView(mockLeaf, mockPlugin);

    // Get the reference to the actual content container
    mockContentContainer = view.contentEl;
    // No need to spyOn methods on mockContentContainer directly if using createMockObsidianElement's features
    // If specific spies are needed on contentEl's methods (like empty, createEl), they can be set up here:
    // e.g., vi.spyOn(mockContentContainer, 'empty'); vi.spyOn(mockContentContainer, 'createEl');
    // However, createMockObsidianElement should already provide vi.fn() mocks for these.
    // To assert on them, use vi.mocked(mockContentContainer.empty) or vi.mocked(mockContentContainer).empty
  });

  it('should return the correct view type', () => {
    expect(view.getViewType()).toBe('magus-mark-tag-management');
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
    // Check if methods exist and are functions (mocks)
    expect(typeof mockContentContainer.empty).toBe('function');
    expect(typeof mockContentContainer.createEl).toBe('function');

    await view.onOpen();

    // Assert against the spies on the *actual* content container (view.contentEl)
    // Ensure these are called on the correct element (view.contentEl)
    expect(vi.mocked(view.contentEl).empty).toHaveBeenCalled();
    expect(vi.mocked(view.contentEl).createEl).toHaveBeenCalledWith('h2', {
      text: 'Magus Mark Tag Management',
    });
    expect(vi.mocked(view.contentEl).createDiv).toHaveBeenCalledWith('tag-section');
    expect(vi.mocked(view.contentEl).createDiv).toHaveBeenCalledWith('actions-section');
    expect(vi.mocked(view.contentEl).createDiv).toHaveBeenCalledWith('stats-section');
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
    const mockContainer: MockObsidianElement<'div'> = createMockObsidianElement('div');

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
