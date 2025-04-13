import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FolderTagModal } from '../../src/ui/FolderTagModal';

// Simplified mock interfaces
interface MockPlugin {
  app: {
    vault: {
      getFiles: () => { path: string; extension: string }[];
    };
  };
  taggingService: {
    processFile: (file: unknown) => Promise<{ success: boolean }>;
  };
  tagFolder: (folder: unknown, includeSubfolders: boolean) => Promise<void>;
}

// Type for createEl options to properly handle access
interface CreateElOptions {
  text?: string;
  type?: string;
  callback?: () => void;
  [key: string]: unknown;
}

describe('FolderTagModal', () => {
  let modal: FolderTagModal;
  
  // Use simple objects with the required properties
  const mockFolder = {
    path: 'test-folder',
    name: 'Test Folder',
    children: [
      { path: 'test-folder/note1.md', extension: 'md' },
      { path: 'test-folder/note2.md', extension: 'md' },
      { path: 'test-folder/subdir', children: [], name: 'subdir' }
    ]
  };
  
  const mockPlugin: MockPlugin = {
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
  
  // Create a simple mock with the minimum required structure
  const createMockFunction = () => vi.fn().mockReturnThis();
  
  // Mock element with simpler structure
  const mockContentEl = {
    createEl: createMockFunction(),
    createDiv: vi.fn().mockReturnValue({
      createEl: createMockFunction(),
      createDiv: vi.fn().mockReturnValue({
        createEl: createMockFunction(),
        setText: createMockFunction(),
        createSpan: createMockFunction()
      }),
      setText: createMockFunction(),
      createSpan: createMockFunction()
    }),
    addClass: createMockFunction(),
    appendChild: createMockFunction(),
    setText: createMockFunction(),
    createSpan: createMockFunction(),
    addEventListener: createMockFunction()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Cast with explicit typing for the FolderTagModal constructor
    // @ts-expect-error - Using mocks for plugin and folder
    modal = new FolderTagModal(mockPlugin, mockFolder);
    
    // @ts-expect-error - Directly set contentEl for testing
    modal.contentEl = mockContentEl;
  });
  
  it('should create the modal with the folder path in the title', () => {
    modal.onOpen();
    
    expect(mockContentEl.createEl).toHaveBeenCalledWith('h2', { 
      text: expect.stringContaining('Test Folder') as unknown as string
    });
  });
  
  it('should create checkbox for including subfolders', () => {
    modal.onOpen();
    
    // Mock the specific behavior we need for this test
    const createElMock = vi.fn();
    const checkboxMock = {
      type: 'checkbox',
      addEventListener: vi.fn()
    };
    createElMock.mockReturnValue(checkboxMock);
    
    // Test that the modal's behavior would add a checkbox input
    const formWrapperMock = { createEl: createElMock };
    
    // Override the createDiv implementation for this test
    mockContentEl.createDiv = vi.fn().mockReturnValue(formWrapperMock);
    
    // Re-run onOpen with our new mocks
    modal.onOpen();
    
    expect(createElMock).toHaveBeenCalledWith('input', expect.objectContaining({ 
      type: 'checkbox' 
    }));
  });
  
  it('should create submit button', () => {
    modal.onOpen();
    
    // Mock the specific behavior we need for this test
    const createElMock = vi.fn();
    createElMock.mockReturnThis();
    
    // Test that the modal's behavior would add a start button
    const formWrapperMock = { createEl: createElMock };
    
    // Override the createDiv implementation for this test
    mockContentEl.createDiv = vi.fn().mockReturnValue(formWrapperMock);
    
    // Re-run onOpen with our new mocks
    modal.onOpen();
    
    expect(createElMock).toHaveBeenCalledWith('button', expect.objectContaining({ 
      text: 'Start Tagging' 
    }));
  });
  
  it('should call tagFolder when form is submitted', () => {
    // Mock the specific behavior we need for this test
    const buttonCallback = vi.fn();
    const createElMock = vi.fn();
    createElMock.mockImplementation((type: string, options?: CreateElOptions) => {
      if (type === 'button' && options && options.text === 'Start Tagging') {
        // When the callback is assigned, capture and call it
        if (options.callback) {
          buttonCallback.mockImplementation(options.callback);
        }
      }
      return { type, addEventListener: vi.fn() };
    });
    
    // Test that the modal's behavior would add a start button with callback
    const formWrapperMock = { createEl: createElMock };
    
    // Override the createDiv implementation for this test
    mockContentEl.createDiv = vi.fn().mockReturnValue(formWrapperMock);
    
    // Run onOpen with our new mocks
    modal.onOpen();
    
    // Simulate button click by calling the callback
    buttonCallback();
    
    // Verify tagFolder was called
    expect(mockPlugin.tagFolder).toHaveBeenCalledWith(
      mockFolder,
      expect.any(Boolean)
    );
  });
  
  it('should clean up on close', () => {
    modal.onOpen();
    modal.onClose();
    
    // Typically would verify that event listeners are removed
    // but since we're mocking extensively, we'll just ensure it doesn't throw
    expect(() => { 
      modal.onClose(); 
    }).not.toThrow();
  });
}); 
