import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TAG_VISUALIZATION_VIEW_TYPE, TagVisualizationView } from './TagVisualizationView';

import type { TFile, WorkspaceLeaf } from 'obsidian';

import type MagusMarkPlugin from '../main';

// Mock some globals for the DOM environment
Object.defineProperty(window, 'cancelAnimationFrame', {
  value: vi.fn(),
  writable: true,
});

let view: TagVisualizationView;
let mockLeaf: WorkspaceLeaf;
let mockPlugin: MagusMarkPlugin;

describe('TagVisualizationView', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { createMockApp, createMockedPlugin } = await import('../__mocks__/obsidian');
    const mockApp = createMockApp();
    mockPlugin = createMockedPlugin() as unknown as MagusMarkPlugin;
    mockPlugin.app = mockApp;

    // Create a mock leaf
    mockLeaf = {
      app: mockApp,
      view: undefined,
      getViewState: vi.fn(() => ({})),
      setViewState: vi.fn(() => Promise.resolve()),
      open: vi.fn(() => Promise.resolve()),
      detach: vi.fn(),
      getDisplayText: vi.fn(() => 'Mock Leaf'),
      getIcon: vi.fn(() => 'mock-icon'),
      tabHeaderEl: document.createElement('div'),
      tabHeaderInnerIconEl: document.createElement('div'),
      tabHeaderInnerTitleEl: document.createElement('div'),
      activeTime: 0,
      pinned: false,
      working: false,
    } as unknown as WorkspaceLeaf;

    // Mock files for tag data
    const mockFiles: TFile[] = [
      { path: 'note1.md', basename: 'note1', extension: 'md' } as TFile,
      { path: 'note2.md', basename: 'note2', extension: 'md' } as TFile,
    ];

    vi.mocked(mockApp.vault.getMarkdownFiles).mockReturnValue(mockFiles);
    vi.mocked(mockApp.metadataCache.getFileCache).mockImplementation((file: TFile) => {
      if (file.path === 'note1.md') {
        return {
          frontmatter: { tags: ['tag1', 'tag2'] },
          tags: [
            {
              tag: '#inline-tag1',
              position: { start: { line: 1, col: 0, offset: 0 }, end: { line: 1, col: 12, offset: 12 } },
            },
          ],
        };
      }
      if (file.path === 'note2.md') {
        return {
          frontmatter: { tags: ['tag2', 'tag3'] },
          tags: [
            {
              tag: '#inline-tag2',
              position: { start: { line: 1, col: 0, offset: 0 }, end: { line: 1, col: 12, offset: 12 } },
            },
          ],
        };
      }
      return null;
    });

    view = new TagVisualizationView(mockLeaf, mockPlugin);

    // Mock canvas for any tests that need it
    const mockCanvas = document.createElement('canvas');
    const mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
  });

  it('should return the correct view type', () => {
    expect(view.getViewType()).toBe(TAG_VISUALIZATION_VIEW_TYPE);
  });

  it('should return the correct display text', () => {
    expect(view.getDisplayText()).toBe('Tag Visualization');
  });

  it('should return the correct icon', () => {
    expect(view.getIcon()).toBe('graph');
  });

  it('should render the view on open', async () => {
    // Create a simple mock element with all required methods
    const mockElement = {
      setText: vi.fn(),
      addClass: vi.fn(),
      removeClass: vi.fn(),
      createEl: vi.fn(),
      createDiv: vi.fn(),
      style: {},
      classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn(), contains: vi.fn() },
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock the container structure that the view actually uses
    const mockContainer = {
      empty: vi.fn(),
      createEl: vi.fn().mockReturnValue(mockElement),
      createDiv: vi.fn().mockReturnValue(mockElement),
      children: [] as any[],
    };

    // Replace the view's containerEl with our mock - this is what the view actually uses
    Object.defineProperty(view, 'containerEl', {
      value: mockContainer,
      writable: true,
      configurable: true,
    });

    await view.onOpen();

    expect(mockContainer.empty).toHaveBeenCalled();
  });

  it('should extract tag data from vault', () => {
    // Test the private getTagData method by calling it indirectly
    const privateView = view as any;
    const tagData = privateView.getTagData();

    expect(Array.isArray(tagData)).toBe(true);
    expect(tagData.length).toBeGreaterThan(0);

    // Check that tags have required properties
    if (tagData.length > 0) {
      expect(tagData[0]).toHaveProperty('id');
      expect(tagData[0]).toHaveProperty('name');
      expect(tagData[0]).toHaveProperty('count');
    }
  });

  it('should handle zoom updates', () => {
    const privateView = view as any;
    privateView.updateZoom(1.5);
    expect(privateView.zoomLevel).toBe(1.5);
  });

  it('should handle filter updates', () => {
    const privateView = view as any;

    // Initialize some mock tags
    privateView.tags = [
      { id: 'tag1', name: '#test', count: 1, visible: true },
      { id: 'tag2', name: '#other', count: 1, visible: true },
    ];

    privateView.updateFilter('test');
    expect(privateView.filterText).toBe('test');

    // Check that visibility is updated correctly
    expect(privateView.tags[0].visible).toBe(true);
    expect(privateView.tags[1].visible).toBe(false);
  });
});
