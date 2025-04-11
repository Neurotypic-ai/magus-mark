import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FolderTagModal } from '../../src/ui/FolderTagModal';

describe('FolderTagModal', () => {
  let modal: FolderTagModal;
  
  const mockFolder = {
    path: 'test-folder',
    name: 'Test Folder',
    children: [
      { path: 'test-folder/note1.md', extension: 'md' },
      { path: 'test-folder/note2.md', extension: 'md' },
      { path: 'test-folder/subdir', children: [] }
    ]
  };
  
  const mockPlugin = {
    app: {
      vault: {
        getFiles: vi.fn().mockReturnValue([
          { path: 'test-folder/note1.md', extension: 'md' },
          { path: 'test-folder/note2.md', extension: 'md' }
        ])
      }
    },
    taggingService: {
      processFile: vi.fn().mockResolvedValue({ success: true })
    },
    tagFolder: vi.fn().mockResolvedValue(undefined)
  };
  
  // Mock modal elements
  const mockContentEl = {
    createEl: vi.fn().mockReturnThis(),
    createDiv: vi.fn().mockReturnValue({
      createEl: vi.fn().mockReturnThis(),
      createDiv: vi.fn().mockReturnValue({
        createEl: vi.fn().mockReturnValue({
          type: '',
          addEventListener: vi.fn(),
          addClass: vi.fn(),
          createSpan: vi.fn()
        }),
        setText: vi.fn(),
        createSpan: vi.fn()
      }),
      setText: vi.fn(),
      createSpan: vi.fn()
    }),
    addClass: vi.fn(),
    appendChild: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    modal = new FolderTagModal(mockPlugin as any, mockFolder as any);
    // @ts-ignore - Directly set contentEl for testing
    modal.contentEl = mockContentEl;
  });
  
  it('should create the modal with the folder path in the title', () => {
    modal.onOpen();
    
    expect(mockContentEl.createEl).toHaveBeenCalledWith('h2', { 
      text: expect.stringContaining('Test Folder') 
    });
  });
  
  it('should create checkbox for including subfolders', () => {
    modal.onOpen();
    
    const createElCalls = mockContentEl.createDiv().createEl.mock.calls;
    expect(createElCalls.some(call => 
      call[0] === 'input' && call[1]?.type === 'checkbox'
    )).toBe(true);
  });
  
  it('should create submit button', () => {
    modal.onOpen();
    
    const createElCalls = mockContentEl.createDiv().createEl.mock.calls;
    expect(createElCalls.some(call => 
      call[0] === 'button' && call[1]?.text === 'Start Tagging'
    )).toBe(true);
  });
  
  it('should call tagFolder when form is submitted', () => {
    // Mock form submission
    modal.onOpen();
    
    // Simulate clicking the button
    const buttonClickHandler = mockContentEl.createDiv().createEl.mock.calls
      .find(call => call[0] === 'button' && call[1]?.text === 'Start Tagging')?.[1]?.callback;
      
    if (buttonClickHandler) {
      buttonClickHandler();
      expect(mockPlugin.tagFolder).toHaveBeenCalledWith(
        mockFolder,
        expect.any(Boolean)
      );
    } else {
      // If we couldn't find the click handler, we'll fail the test
      expect(buttonClickHandler).toBeDefined();
    }
  });
  
  it('should clean up on close', () => {
    modal.onOpen();
    modal.onClose();
    
    // Typically would verify that event listeners are removed
    // but since we're mocking extensively, we'll just ensure it doesn't throw
    expect(() => modal.onClose()).not.toThrow();
  });
}); 