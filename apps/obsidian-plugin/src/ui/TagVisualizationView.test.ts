import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TagVisualizationView } from './TagVisualizationView';

import type { MetadataCache, Vault, Workspace, WorkspaceLeaf } from 'obsidian';

import type ObsidianMagicPlugin from '../main';

// Create a type for our test subject that exposes private methods for testing
type TestableTagVisualizationView = TagVisualizationView & {
  buildTagGraph: () => {
    nodes: { id: string; label: string; count: number }[];
    links: { source: string; target: string; weight: number }[];
  };
  setupVisualization: () => void;
  getAllTags: () => { id: string; name: string; count: number; files: string[] }[];
  filterVisualization: (filter: string) => void;
  updateVisualization: () => void;
};

// Mock WorkspaceLeaf
const mockLeaf = {
  view: {
    file: { path: 'mock-leaf-file.md', basename: 'mock-leaf-file', extension: 'md' },
  },
} as unknown as WorkspaceLeaf; // Cast remains necessary for partial mock

// Properly mock canvas context with proper type handling
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  canvas: {} as HTMLCanvasElement,
  getContextAttributes: vi.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  // Add other required properties to satisfy CanvasRenderingContext2D
  fillStyle: '#000',
  strokeStyle: '#000',
  lineWidth: 1,
  font: '12px sans-serif',
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  getTransform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
};

// Properly mock getContext to handle contextId parameter
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId) => {
  if (contextId === '2d') {
    return mockContext as unknown as CanvasRenderingContext2D;
  }
  return null;
});

describe('TagVisualizationView', () => {
  let view: TestableTagVisualizationView;
  let mockContainerEl: HTMLElement; // To hold the view's container

  // Using Partial for the mocks
  const mockPlugin = {
    app: {
      metadataCache: {
        getFileCache: vi.fn().mockReturnValue({
          frontmatter: { tags: ['test-tag'] },
          tags: [{ tag: '#inline-tag', position: { start: { line: 5 } } }],
        }),
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      } as unknown as Partial<MetadataCache>,
      vault: {
        getMarkdownFiles: vi.fn().mockReturnValue([{ path: 'note1.md' }, { path: 'note2.md' }]),
      } as unknown as Partial<Vault>,
      workspace: {
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      } as unknown as Partial<Workspace>,
    },
  } as unknown as ObsidianMagicPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create the view instance
    view = new TagVisualizationView(mockLeaf, mockPlugin) as TestableTagVisualizationView;
    // Get the container created by the ItemView mock constructor
    mockContainerEl = view.containerEl;
    // Add spies/mocks to the container if tests need them
    vi.spyOn(mockContainerEl, 'empty');
    vi.spyOn(mockContainerEl, 'createEl');
    // Add more spies as needed
  });

  it('should return the correct view type', () => {
    expect(view.getViewType()).toBe('obsidian-magic-tag-visualization');
  });

  it('should return the correct display text', () => {
    expect(view.getDisplayText()).toBe('Tag Visualization');
  });

  it('should return the correct icon', () => {
    expect(view.getIcon()).toBe('graph');
  });

  it('should render the view on open', async () => {
    // Mock the visualization methods
    vi.spyOn(view, 'buildTagGraph').mockReturnValue({
      nodes: [
        { id: 'tag1', label: '#tag1', count: 3 },
        { id: 'tag2', label: '#tag2', count: 1 },
      ],
      links: [{ source: 'tag1', target: 'tag2', weight: 1 }],
    });

    vi.spyOn(view, 'setupVisualization').mockImplementation(() => {
      // Empty implementation for the test
      return;
    });

    await view.onOpen();

    // Use the mocked containerEl obtained in beforeEach
    expect(mockContainerEl.empty).toHaveBeenCalled();
    expect(mockContainerEl.createEl).toHaveBeenCalledWith('h2', { text: 'Tag Visualization' });
  });

  it('should build tag graph from vault data', () => {
    // Mock the getAllTags method
    vi.spyOn(view, 'getAllTags').mockReturnValue([
      { id: 'tag-1', name: '#tag1', count: 3, files: ['note1.md', 'note2.md'] },
      { id: 'tag-2', name: '#tag2', count: 1, files: ['note1.md'] },
    ]);

    const graph = view.buildTagGraph();

    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('links');
    expect(graph.nodes.length).toBeGreaterThan(0);
  });

  it('should handle filtering the visualization', () => {
    // Mock required methods
    vi.spyOn(view, 'buildTagGraph').mockReturnValue({
      nodes: [
        { id: 'tag1', label: '#tag1', count: 3 },
        { id: 'tag2', label: '#tag2', count: 1 },
      ],
      links: [{ source: 'tag1', target: 'tag2', weight: 1 }],
    });

    vi.spyOn(view, 'updateVisualization').mockImplementation(() => {
      // Empty implementation for visualization update in tests
      return;
    });

    // Call the filter method
    view.filterVisualization('tag1');

    // Expect updateVisualization to be called with filtered data
    expect(view.updateVisualization).toHaveBeenCalled();
  });
});
