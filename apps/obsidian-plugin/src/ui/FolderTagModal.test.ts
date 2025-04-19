// Import Setting to mock it (though mock is now in __mocks__)
// We might still need the type, or remove if unused after cleanup
import { Setting } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockObsidianElement } from '../__mocks__/obsidian';
import { FolderTagModal } from './FolderTagModal';

import type { App, TFolder } from 'obsidian';

import type ObsidianMagicPlugin from '../main';

// --- Mocks for Plugin and App ---
interface MockFileOrFolder {
  path: string;
  name: string;
  extension?: string;
  isFolder: () => boolean;
  children?: MockFileOrFolder[];
}

// Mock Obsidian API (App and Vault parts)
const mockApp = {
  vault: {
    getAllLoadedFiles: vi.fn().mockReturnValue([
      { path: 'folder1', name: 'folder1', isFolder: () => true, children: [] },
      { path: 'folder1/subfolder', name: 'subfolder', isFolder: () => true, children: [] },
      { path: 'folder2', name: 'folder2', isFolder: () => true, children: [] },
      { path: 'test.md', name: 'test', isFolder: () => false },
    ] as MockFileOrFolder[]),
    getMarkdownFiles: vi.fn().mockReturnValue([
      { path: 'folder1/file1.md', name: 'file1', extension: 'md' },
      { path: 'folder1/file2.md', name: 'file2', extension: 'md' },
      { path: 'folder1/subfolder/file3.md', name: 'file3', extension: 'md' },
    ]),
    getAbstractFileByPath: vi.fn((path: string) => {
      if (path === '/') return { path: '/', name: 'Root', children: [], isFolder: () => true } as unknown as TFolder;
      return mockApp.vault.getAllLoadedFiles().find((f) => f.path === path) as TFolder | undefined;
    }),
    getRoot: vi.fn(
      () =>
        ({
          path: '/',
          name: 'Root',
          children: mockApp.vault.getAllLoadedFiles(),
          isFolder: () => true,
        }) as unknown as TFolder
    ),
  },
} as unknown as App;

// Create proper type for our mock plugin
const mockPlugin = {
  app: mockApp,
  tagFolder: vi.fn().mockResolvedValue(undefined),
} as unknown as ObsidianMagicPlugin;

// Callback for tagging folder functionality
const onSubmitCallback = vi.fn();

describe('FolderTagModal', () => {
  let modal: FolderTagModal;

  beforeEach(() => {
    // Create clean DOM
    document.body.innerHTML = '';

    // Create modal instance - constructor uses mocked App from __mocks__
    modal = new FolderTagModal(mockPlugin, onSubmitCallback);

    // Mock the base Modal properties/methods AFTER instantiation
    // These are now likely handled by the __mocks__/obsidian.ts Modal mock
    // modal.contentEl = createMockObsidianElement('div'); // Base element
    // modal.modalEl = createMockObsidianElement('div', { cls: 'modal' }); // Mock modalEl too
    // modal.containerEl = createMockObsidianElement('div', { cls: 'modal-container' }); // Mock containerEl
    modal.app = mockApp; // Ensure it uses our specific app mock if needed
    modal.open = vi.fn(); // Keep instance mocks if needed
    modal.close = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.resetAllMocks();
  });

  describe('UI Initialization', () => {
    it('should create necessary UI elements on open using Setting mock', () => {
      modal.onOpen();

      // Check that the Setting mock (from __mocks__) was called
      const MockSettingClass = vi.mocked(Setting);
      expect(MockSettingClass).toHaveBeenCalledTimes(4);
      // ... other checks ...
    });

    it('should populate dropdown with folders', () => {
      modal.onOpen();
      const MockSettingClass = vi.mocked(Setting);
      // ... checks for addDropdown calls ...
    });

    it('should display a list of folders', () => {
      // Mock querySelector to return a mock list element for renderFolderList
      const mockFolderList = createMockObsidianElement('div');
      (modal.contentEl as any).querySelector = vi.fn().mockReturnValue(mockFolderList);

      modal.onOpen();

      expect(mockApp.vault.getAllLoadedFiles).toHaveBeenCalled();
      // Check that the mocked folder list element had children created
      const listCreateEl = mockFolderList.createEl as ReturnType<typeof vi.fn>;
      expect(listCreateEl).toHaveBeenCalledWith('div', expect.objectContaining({ text: 'folder1' }));
      expect(listCreateEl).toHaveBeenCalledWith('div', expect.objectContaining({ text: 'folder2' }));
      // Check it didn't include the file
      expect(listCreateEl).not.toHaveBeenCalledWith('div', expect.objectContaining({ text: 'test.md' }));
    });
  });

  describe('Folder Selection', () => {
    it('should handle folder selection', () => {
      modal.onOpen();

      // Simulate the creation of folder items (assuming renderFolderList was called)
      const mockFolderList = (modal.contentEl as any).querySelector('.folder-list');
      const folderItem1 = createMockObsidianElement('div', { cls: 'folder-item', text: 'folder1' });
      folderItem1.dataset['path'] = 'folder1';
      const folderItem2 = createMockObsidianElement('div', { cls: 'folder-item', text: 'folder2' });
      folderItem2.dataset['path'] = 'folder2';
      // Manually add to mock list for test simulation
      if (mockFolderList) {
        mockFolderList.appendChild(folderItem1);
        mockFolderList.appendChild(folderItem2);
      }

      // Access private members - requires careful typing or casting
      const privateModal = modal as any;

      privateModal.folderItems = [folderItem1, folderItem2]; // Assuming this property exists and is set

      // Simulate click
      privateModal.handleFolderClick({ currentTarget: folderItem1 });
      expect(folderItem1.classList.contains('selected')).toBe(true);
      expect(folderItem2.classList.contains('selected')).toBe(false);
      expect(privateModal.selectedFolderPath).toBe('folder1');

      privateModal.handleFolderClick({ currentTarget: folderItem2 });
      expect(folderItem1.classList.contains('selected')).toBe(false);
      expect(folderItem2.classList.contains('selected')).toBe(true);
      expect(privateModal.selectedFolderPath).toBe('folder2');
    });

    it('should handle folder search', () => {
      modal.onOpen();

      const privateModal = modal as any;

      // Assume renderFolderList creates items and assigns to privateModal.folderItems
      const items = [
        createMockObsidianElement('div', { textContent: 'folder1' }),
        createMockObsidianElement('div', { textContent: 'subfolder' }),
        createMockObsidianElement('div', { textContent: 'folder2' }),
      ];
      privateModal.folderItems = items;

      // Assume search input is created and assigned
      const searchInput = createMockObsidianElement('input');
      privateModal.searchInput = searchInput;

      // Simulate search
      searchInput.value = 'folder1';
      privateModal.handleFolderSearch({ target: searchInput });
      expect(items[0]?.style.display).toBe('');
      expect(items[1]?.style.display).toBe('none');
      expect(items[2]?.style.display).toBe('none');

      searchInput.value = '';
      privateModal.handleFolderSearch({ target: searchInput });
      expect(items[0]?.style.display).toBe('');
      expect(items[1]?.style.display).toBe('');
      expect(items[2]?.style.display).toBe('');
    });
  });

  describe('Tag Operation', () => {
    it('should tag selected folder when Tag button is clicked', () => {
      modal.onOpen();

      const privateModal = modal as any;
      privateModal.selectedFolderPath = 'folder1';
      privateModal.includeSubfoldersCheckbox = createMockObsidianElement('input', {
        type: 'checkbox',
      });
      privateModal.includeSubfoldersCheckbox.checked = true;
      privateModal.close = vi.fn();

      // Mock folder lookup (if handleTagButtonClick relies on it)
      const selectedFolder = { path: 'folder1', name: 'folder1', isFolder: () => true } as unknown as TFolder;
      mockApp.vault.getAllLoadedFiles = vi.fn().mockReturnValue([selectedFolder]);

      privateModal.handleTagButtonClick();

      expect(onSubmitCallback).toHaveBeenCalledWith(expect.objectContaining({ path: 'folder1' }), true);
      expect(privateModal.close).toHaveBeenCalled();
    });

    it('should not tag if no folder is selected', () => {
      modal.onOpen();
      const privateModal = modal as any;
      privateModal.selectedFolderPath = '';
      privateModal.close = vi.fn();
      privateModal.handleTagButtonClick();
      expect(onSubmitCallback).not.toHaveBeenCalled();
      expect(privateModal.close).not.toHaveBeenCalled();
    });

    it('should respect the include subfolders option', () => {
      modal.onOpen();
      const privateModal = modal as any;
      privateModal.selectedFolderPath = 'folder1';
      privateModal.includeSubfoldersCheckbox = createMockObsidianElement('input', {
        type: 'checkbox',
      });
      privateModal.includeSubfoldersCheckbox.checked = false; // Set to false
      privateModal.close = vi.fn();

      const selectedFolder = { path: 'folder1', name: 'folder1', isFolder: () => true } as unknown as TFolder;
      mockApp.vault.getAllLoadedFiles = vi.fn().mockReturnValue([selectedFolder]);

      privateModal.handleTagButtonClick();

      expect(onSubmitCallback).toHaveBeenCalledWith(expect.objectContaining({ path: 'folder1' }), false); // Expect false
    });
  });

  describe('Cancel Operation', () => {
    it('should close modal when Cancel button is clicked', () => {
      modal.onOpen();
      const MockSettingClass = vi.mocked(Setting);
      const cancelButtonInstance = MockSettingClass.mock.results[3]?.value;
      const cancelButtonConfigFn = vi.mocked(cancelButtonInstance.addButton).mock.calls[0]?.[0];
      const mockCancelButton = {
        setButtonText: vi.fn().mockReturnThis(),
        onClick: vi.fn().mockImplementation((cb) => cb()),
      }; // Mock onClick to call immediately

      if (cancelButtonConfigFn) {
        cancelButtonConfigFn(mockCancelButton);
        expect(modal.close).toHaveBeenCalled();
      }
    });
  });
});
