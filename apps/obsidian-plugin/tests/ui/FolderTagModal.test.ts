import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FolderTagModal } from '../../src/ui/FolderTagModal';
import type ObsidianMagicPlugin from '../../src/main';
import type { App, TFolder } from 'obsidian';

// Define interfaces for our mocks
interface MockFileOrFolder {
  path: string;
  name: string;
  extension?: string;
  isFolder: () => boolean;
  children?: MockFileOrFolder[];
}

// Mock Obsidian API
const mockApp = {
  vault: {
    getAllLoadedFiles: vi.fn().mockReturnValue([
      {
        path: 'folder1',
        name: 'folder1',
        isFolder: () => true,
        children: []
      },
      {
        path: 'folder1/subfolder',
        name: 'subfolder',
        isFolder: () => true,
        children: []
      },
      {
        path: 'folder2',
        name: 'folder2',
        isFolder: () => true,
        children: []
      },
      {
        path: 'test.md',
        name: 'test',
        isFolder: () => false
      }
    ] as MockFileOrFolder[]),
    getMarkdownFiles: vi.fn().mockReturnValue([
      {
        path: 'folder1/file1.md',
        name: 'file1',
        extension: 'md'
      },
      {
        path: 'folder1/file2.md',
        name: 'file2',
        extension: 'md'
      },
      {
        path: 'folder1/subfolder/file3.md',
        name: 'file3',
        extension: 'md'
      }
    ])
  }
} as unknown as App;

// Create proper type for our mock plugin
const mockPlugin = {
  app: mockApp,
  tagFolder: vi.fn().mockResolvedValue(undefined)
} as unknown as ObsidianMagicPlugin;

// Callback for tagging folder functionality
const onSubmitCallback = vi.fn();

// Type definition for element attributes
interface ElementAttrs {
  cls?: string;
  text?: string;
  type?: string;
  placeholder?: string;
  value?: string;
}

describe('FolderTagModal', () => {
  let modal: FolderTagModal;
  
  // Mock DOM elements
  const createEl = vi.fn().mockImplementation((tag: string, attrs?: ElementAttrs) => {
    const el = document.createElement(tag);
    if (attrs) {
      if (attrs.cls) {
        el.className = attrs.cls;
      }
      if (attrs.text) {
        el.textContent = attrs.text;
      }
      if (attrs.type) {
        (el as HTMLInputElement).type = attrs.type;
      }
      if (attrs.placeholder) {
        (el as HTMLInputElement).placeholder = attrs.placeholder;
      }
      if (attrs.value) {
        (el as HTMLInputElement).value = attrs.value;
      }
    }
    return el;
  });
  
  // Create a DOM element factory function to avoid using deprecated createElement directly
  const createDomElement = (tag: string): HTMLElement => {
    return document.createElement(tag);
  };
  
  beforeEach(() => {
    // Create clean DOM for each test
    document.body.innerHTML = '';
    
    // Create modal instance with the correct constructor parameters
    modal = new FolderTagModal(mockPlugin, onSubmitCallback);
    
    // Mock modal methods and properties
    modal.contentEl = {
      createEl,
      createDiv: createEl.mockImplementation(() => {
        const div = createDomElement('div') as HTMLDivElement;
        return div;
      }),
      querySelector: vi.fn().mockImplementation(() => createDomElement('div') as HTMLDivElement),
      querySelectorAll: vi.fn().mockImplementation(() => []),
      appendChild: vi.fn().mockImplementation((el: Node) => el),
      empty: vi.fn()
    } as unknown as HTMLElement;
    
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });
  
  describe('UI Initialization', () => {
    it('should create necessary UI elements on open', () => {
      modal.onOpen();
      
      // Check that UI elements were created
      expect(createEl).toHaveBeenCalledWith('h2', { text: 'Select a Folder to Tag' });
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'folder-search-container' });
      expect(createEl).toHaveBeenCalledWith('input', { 
        type: 'text', 
        cls: 'folder-search-input',
        placeholder: 'Search folders...'
      });
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'folder-list' });
      
      // Check for folder options
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'folder-tag-options' });
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'setting-item' });
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'setting-item-info' });
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'setting-item-control' });
      
      // Check for action buttons
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'modal-button-container' });
      expect(createEl).toHaveBeenCalledWith('button', { cls: 'mod-cta', text: 'Tag' });
      expect(createEl).toHaveBeenCalledWith('button', { text: 'Cancel' });
    });
    
    it('should display a list of folders', () => {
      modal.onOpen();
      
      // Check that folders were listed
      expect(mockApp.vault.getAllLoadedFiles).toHaveBeenCalled();
      
      // Check that our mock data handling created folder items
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'folder-item', text: 'folder1' });
      expect(createEl).toHaveBeenCalledWith('div', { cls: 'folder-item', text: 'folder2' });
    });
  });
  
  describe('Folder Selection', () => {
    it('should handle folder selection', () => {
      modal.onOpen();
      
      // Create mock folder elements using our factory function
      const folderItem1 = createDomElement('div') as HTMLDivElement;
      folderItem1.classList.add('folder-item');
      folderItem1.dataset['path'] = 'folder1';
      folderItem1.textContent = 'folder1';
      
      const folderItem2 = createDomElement('div') as HTMLDivElement;
      folderItem2.classList.add('folder-item');
      folderItem2.dataset['path'] = 'folder2';
      folderItem2.textContent = 'folder2';
      
      // Mock folder list
      const privateModal = modal as unknown as { 
        folderItems: HTMLDivElement[]; 
        selectedFolderPath: string;
        handleFolderClick: (e: { currentTarget: HTMLDivElement }) => void;
      };
      
      privateModal.folderItems = [folderItem1, folderItem2];
      
      // Simulate click on a folder
      privateModal.handleFolderClick({ currentTarget: folderItem1 });
      
      // Check that folder was selected
      expect(folderItem1.classList.contains('selected')).toBe(true);
      expect(folderItem2.classList.contains('selected')).toBe(false);
      expect(privateModal.selectedFolderPath).toBe('folder1');
      
      // Simulate click on another folder
      privateModal.handleFolderClick({ currentTarget: folderItem2 });
      
      // Check that selection changed
      expect(folderItem1.classList.contains('selected')).toBe(false);
      expect(folderItem2.classList.contains('selected')).toBe(true);
      expect(privateModal.selectedFolderPath).toBe('folder2');
    });
    
    it('should handle folder search', () => {
      modal.onOpen();
      
      // Create mock folder items with full type definition
      const items = [
        { textContent: 'folder1', style: { display: '' } },
        { textContent: 'subfolder', style: { display: '' } },
        { textContent: 'folder2', style: { display: '' } }
      ] as HTMLDivElement[];
      
      // Access private members with proper typing
      const privateModal = modal as unknown as {
        folderItems: HTMLDivElement[];
        searchInput: HTMLInputElement;
        handleFolderSearch: (e: { target: HTMLInputElement }) => void;
      };
      
      // Mock folder list
      privateModal.folderItems = items;
      
      // Create search input using our factory function
      const searchInput = createDomElement('input') as HTMLInputElement;
      privateModal.searchInput = searchInput;
      
      // Simulate search for "folder1"
      searchInput.value = 'folder1';
      privateModal.handleFolderSearch({ target: searchInput });
      
      // Check that only matching folders are shown
      expect(items[0]?.style.display).toBe('');
      expect(items[1]?.style.display).toBe('none');
      expect(items[2]?.style.display).toBe('none');
      
      // Simulate search for "folder"
      searchInput.value = 'folder';
      privateModal.handleFolderSearch({ target: searchInput });
      
      // Check that both "folder1" and "folder2" are shown
      expect(items[0]?.style.display).toBe('');
      expect(items[1]?.style.display).toBe('none');
      expect(items[2]?.style.display).toBe('');
      
      // Clear search
      searchInput.value = '';
      privateModal.handleFolderSearch({ target: searchInput });
      
      // Check that all folders are shown
      expect(items[0]?.style.display).toBe('');
      expect(items[1]?.style.display).toBe('');
      expect(items[2]?.style.display).toBe('');
    });
  });
  
  describe('Tag Operation', () => {
    it('should tag selected folder when Tag button is clicked', () => {
      modal.onOpen();
      
      // Access private members with proper typing
      const privateModal = modal as unknown as {
        selectedFolderPath: string;
        includeSubfoldersCheckbox: HTMLInputElement;
        handleTagButtonClick: () => void;
        close: () => void;
      };
      
      // Select a folder
      privateModal.selectedFolderPath = 'folder1';
      
      // Mock selected folder
      const selectedFolder = {
        path: 'folder1',
        name: 'folder1',
        isFolder: () => true
      } as unknown as TFolder;
      
      // Mock folder lookup
      mockApp.vault.getAllLoadedFiles = vi.fn().mockReturnValue([selectedFolder]);
      
      // Toggle include subfolders using our factory function
      const includeSubfoldersCheckbox = createDomElement('input') as HTMLInputElement;
      includeSubfoldersCheckbox.type = 'checkbox';
      includeSubfoldersCheckbox.checked = true;
      privateModal.includeSubfoldersCheckbox = includeSubfoldersCheckbox;
      
      // Mock close method
      privateModal.close = vi.fn();
      
      // Simulate Tag button click
      privateModal.handleTagButtonClick();
      
      // Check that the onSubmit callback was called with selected folder and option
      expect(onSubmitCallback).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'folder1' }),
        true
      );
      
      // Check modal was closed
      expect(privateModal.close).toHaveBeenCalled();
    });
    
    it('should not tag if no folder is selected', () => {
      modal.onOpen();
      
      // Access private members with proper typing
      const privateModal = modal as unknown as {
        selectedFolderPath: string;
        handleTagButtonClick: () => void;
        close: () => void;
      };
      
      // No folder selected
      privateModal.selectedFolderPath = '';
      
      // Mock close method
      privateModal.close = vi.fn();
      
      // Simulate Tag button click
      privateModal.handleTagButtonClick();
      
      // Check that onSubmit callback was not called
      expect(onSubmitCallback).not.toHaveBeenCalled();
      
      // Check modal was not closed
      expect(privateModal.close).not.toHaveBeenCalled();
    });
    
    it('should respect the include subfolders option', () => {
      modal.onOpen();
      
      // Access private members with proper typing
      const privateModal = modal as unknown as {
        selectedFolderPath: string;
        includeSubfoldersCheckbox: HTMLInputElement;
        handleTagButtonClick: () => void;
        close: () => void;
      };
      
      // Select a folder
      privateModal.selectedFolderPath = 'folder1';
      
      // Mock selected folder
      const selectedFolder = {
        path: 'folder1',
        name: 'folder1',
        isFolder: () => true
      } as unknown as TFolder;
      
      // Mock folder lookup
      mockApp.vault.getAllLoadedFiles = vi.fn().mockReturnValue([selectedFolder]);
      
      // Toggle include subfolders OFF using our factory function
      const includeSubfoldersCheckbox = createDomElement('input') as HTMLInputElement;
      includeSubfoldersCheckbox.type = 'checkbox';
      includeSubfoldersCheckbox.checked = false;
      privateModal.includeSubfoldersCheckbox = includeSubfoldersCheckbox;
      
      // Mock close method
      privateModal.close = vi.fn();
      
      // Simulate Tag button click
      privateModal.handleTagButtonClick();
      
      // Check that onSubmit callback was called with selected folder and option = false
      expect(onSubmitCallback).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'folder1' }),
        false
      );
    });
  });
  
  describe('Cancel Operation', () => {
    it('should close modal when Cancel button is clicked', () => {
      modal.onOpen();
      
      // Mock close method
      modal.close = vi.fn();
      
      // Access private method
      const privateModal = modal as unknown as {
        handleCancelButtonClick: () => void;
      };
      
      // Simulate Cancel button click
      privateModal.handleCancelButtonClick();
      
      // Check that modal was closed
      expect(modal.close).toHaveBeenCalled();
    });
  });
}); 
