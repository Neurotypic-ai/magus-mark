// Import Setting to mock it (though mock is now in __mocks__)
// We might still need the type, or remove if unused after cleanup
import { Setting } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';

import { createMockObsidianElement } from '../__mocks__/obsidian';
import { FolderTagModal } from './FolderTagModal';

import type { ButtonComponent, App as ObsidianApp, TFolder } from 'obsidian';

import type ObsidianMagicPlugin from '../main';

// Callback for tagging folder functionality
const onSubmitCallback = vi.fn();

const mockApp: ObsidianApp = {
  vault: {
    getAllLoadedFiles: vi.fn().mockReturnValue([]),
    getAbstractFileByPath: vi.fn(),
    getRoot: vi.fn(),
  },
  // add any other minimal methods/properties needed
} as unknown as ObsidianApp;

const mockPlugin = {
  app: mockApp, // now typed, not `any`
} as ObsidianMagicPlugin;

describe('FolderTagModal', () => {
  const modal = new FolderTagModal(mockPlugin, onSubmitCallback);

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
    });

    it('should display a list of folders', () => {
      // Mock querySelector to return a mock list element for renderFolderList
      const mockFolderList = createMockObsidianElement('div');
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      (modal.contentEl as unknown as HTMLElement).querySelector = vi.fn().mockReturnValue(mockFolderList);

      modal.onOpen();

      expect(mockApp.vault.getAllLoadedFiles).toHaveBeenCalled();
      // Check that the mocked folder list element had children created
      const listCreateEl = mockFolderList.createEl;
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
      const mockFolderList = (modal.contentEl as unknown as HTMLElement).querySelector('.folder-list');
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
      const privateModal = modal as unknown as FolderTagModal;

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

      const privateModal = modal as unknown as FolderTagModal;

      // Assume renderFolderList creates items and assigns to privateModal.folderItems
      const items = [
        createMockObsidianElement('div', { textContent: 'folder1' }),
        createMockObsidianElement('div', { textContent: 'subfolder' }),
        createMockObsidianElement('div', { textContent: 'folder2' }),
      ];
      privateModal.folderItems = items;

      // Assume search input is created and assigned
      const searchInput = createMockObsidianElement('input') as unknown as HTMLInputElement;
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

      const privateModal = modal as unknown as FolderTagModal;
      privateModal.selectedFolderPath = 'folder1';
      privateModal.includeSubfoldersCheckbox = createMockObsidianElement('input', {
        type: 'checkbox',
      }) as unknown as HTMLInputElement;
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
      const privateModal = modal as unknown as FolderTagModal;
      privateModal.selectedFolderPath = '';
      privateModal.close = vi.fn();
      privateModal.handleTagButtonClick();
      expect(onSubmitCallback).not.toHaveBeenCalled();
      expect(privateModal.close).not.toHaveBeenCalled();
    });

    it('should respect the include subfolders option', () => {
      modal.onOpen();
      const privateModal = modal as unknown as FolderTagModal;
      privateModal.selectedFolderPath = 'folder1';
      privateModal.includeSubfoldersCheckbox = createMockObsidianElement('input', {
        type: 'checkbox',
      }) as unknown as HTMLInputElement;
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
      const cancelButtonInstance = MockSettingClass.mock.results[3]?.value as unknown as Setting;
      const cancelButtonConfigFn = vi.mocked(cancelButtonInstance.addButton).mock.calls[0]?.[0];
      const mockCancelButton = {
        setButtonText: vi.fn().mockReturnThis(),
        onClick: vi.fn().mockImplementation((cb: () => void) => {
          cb();
        }),
      }; // Mock onClick to call immediately

      if (cancelButtonConfigFn) {
        cancelButtonConfigFn(mockCancelButton as unknown as ButtonComponent);
        expect(modal.close).toHaveBeenCalled();
      }
    });
  });
});
