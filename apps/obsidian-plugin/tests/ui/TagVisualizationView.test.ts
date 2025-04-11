import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TagVisualizationView } from '../../src/ui/TagVisualizationView';

// Mock WorkspaceLeaf
const mockLeaf = {
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
            addClass: vi.fn().mockReturnThis(),
          }),
        }),
      },
    ],
  },
};

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
  let view: TagVisualizationView;

  const mockPlugin = {
    app: {
      metadataCache: {
        getFileCache: vi.fn().mockReturnValue({
          frontmatter: { tags: ['test-tag'] },
          tags: [{ tag: '#inline-tag', position: { start: { line: 5 } } }],
        }),
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      },
      vault: {
        getMarkdownFiles: vi.fn().mockReturnValue([{ path: 'note1.md' }, { path: 'note2.md' }]),
      },
      workspace: {
        on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    view = new TagVisualizationView(mockLeaf as any, mockPlugin as any);
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
    vi.spyOn(view as any, 'buildTagGraph').mockReturnValue({
      nodes: [
        { id: 'tag1', label: '#tag1', count: 3 },
        { id: 'tag2', label: '#tag2', count: 1 },
      ],
      links: [{ source: 'tag1', target: 'tag2', weight: 1 }],
    });

    vi.spyOn(view as any, 'setupVisualization').mockImplementation(() => {});

    await view.onOpen();

    const container = mockLeaf.containerEl.children[1];
    expect(container.empty).toHaveBeenCalled();
    expect(container.createEl).toHaveBeenCalledWith('h2', { text: 'Tag Visualization' });
  });

  it('should build tag graph from vault data', () => {
    // Mock the getAllTags method
    vi.spyOn(view as any, 'getAllTags').mockReturnValue([
      { id: 'tag-1', name: '#tag1', count: 3, files: ['note1.md', 'note2.md'] },
      { id: 'tag-2', name: '#tag2', count: 1, files: ['note1.md'] },
    ]);

    const graph = view['buildTagGraph']();

    expect(graph).toHaveProperty('nodes');
    expect(graph).toHaveProperty('links');
    expect(graph.nodes.length).toBeGreaterThan(0);
  });

  it('should handle filtering the visualization', () => {
    // Mock required methods
    vi.spyOn(view as any, 'buildTagGraph').mockReturnValue({
      nodes: [
        { id: 'tag1', label: '#tag1', count: 3 },
        { id: 'tag2', label: '#tag2', count: 1 },
      ],
      links: [{ source: 'tag1', target: 'tag2', weight: 1 }],
    });

    vi.spyOn(view as any, 'updateVisualization').mockImplementation(() => {});

    // Call the filter method
    view['filterVisualization']('tag1');

    // Expect updateVisualization to be called with filtered data
    expect(view['updateVisualization']).toHaveBeenCalled();
  });
});
