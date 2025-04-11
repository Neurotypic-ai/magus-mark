import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagManagementView } from '../../src/ui/TagManagementView';

// Mock WorkspaceLeaf
const mockLeaf = {
  containerEl: {
    children: [
      {}, // First child (typically header)
      {  // Content container
        empty: vi.fn(),
        createEl: vi.fn().mockReturnThis(),
        createDiv: vi.fn().mockReturnValue({
          createEl: vi.fn().mockReturnThis(),
          createDiv: vi.fn().mockReturnValue({
            createEl: vi.fn().mockReturnValue({
              addEventListener: vi.fn()
            }),
            createSpan: vi.fn().mockReturnThis(),
            setText: vi.fn()
          })
        })
      }
    ]
  }
};

describe('TagManagementView', () => {
  let view: TagManagementView;
  
  const mockPlugin = {
    app: {
      metadataCache: {
        getFileCache: vi.fn().mockReturnValue({
          frontmatter: { tags: ['test-tag'] },
          tags: [{ tag: '#inline-tag', position: { start: { line: 5 } } }]
        })
      },
      vault: {
        getMarkdownFiles: vi.fn().mockReturnValue([
          { path: 'note1.md' },
          { path: 'note2.md' }
        ])
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    view = new TagManagementView(mockLeaf as any, mockPlugin as any);
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
    
    const container = mockLeaf.containerEl.children[1];
    expect(container.empty).toHaveBeenCalled();
    expect(container.createEl).toHaveBeenCalledWith('h2', { text: 'Obsidian Magic Tag Management' });
  });

  it('should collect tags from the vault', () => {
    const getAllTagsMethod = view['getAllTags'].bind(view);
    const tags = getAllTagsMethod();
    
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
  });

  it('should render tags list with filter', () => {
    const mockContainer = {
      empty: vi.fn(),
      createEl: vi.fn().mockReturnThis(),
      createSpan: vi.fn().mockReturnThis(),
      setText: vi.fn()
    };
    
    // Mock getAllTags to return test data
    vi.spyOn(view as any, 'getAllTags').mockReturnValue([
      { id: 'tag-1', name: '#tag1', count: 3 },
      { id: 'tag-2', name: '#tag2', count: 1 }
    ]);
    
    view['renderTagsList'](mockContainer as any, 'tag1');
    
    expect(mockContainer.empty).toHaveBeenCalled();
  });
}); 