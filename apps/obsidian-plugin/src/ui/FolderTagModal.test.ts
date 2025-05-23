import { Setting } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockApp, createMockedPlugin } from '../__mocks__/obsidian';
import { createMockObsidianElement } from '../testing/createMockObsidianElement';
import { FolderTagModal } from './FolderTagModal';

import type { App, ButtonComponent, TAbstractFile, TFolder } from 'obsidian';
import type { Mock } from 'vitest';

import type ObsidianMagicPlugin from '../main';

// Callback for tagging folder functionality
const onSubmitCallback = vi.fn();

let testPlugin: ObsidianMagicPlugin;
let testApp: App;
let mockFilesAndFolders: TAbstractFile[];

describe('FolderTagModal', () => {
  let modal: FolderTagModal;

  beforeEach(() => {
    // Reset mocks and state before each test
    vi.clearAllMocks();
    onSubmitCallback.mockClear();

    mockFilesAndFolders = [
      {
        path: 'folder1',
        name: 'folder1',
        parent: { path: '' } as TFolder,
        children: [],
        isFolder: () => true,
      } as unknown as TFolder,
      {
        path: 'folder2',
        name: 'folder2',
        parent: { path: '' } as TFolder,
        children: [],
        isFolder: () => true,
      } as unknown as TFolder,
      {
        path: 'test.md',
        name: 'test.md',
        parent: { path: '' } as TFolder,
        children: [],
        isFolder: () => false,
      } as unknown as TAbstractFile,
    ];

    testApp = createMockApp();
    testPlugin = createMockedPlugin() as unknown as ObsidianMagicPlugin;

    // Mock methods on testApp.vault
    vi.spyOn(testApp.vault, 'getAllLoadedFiles').mockReturnValue(mockFilesAndFolders);
    vi.spyOn(testApp.vault, 'getAbstractFileByPath').mockImplementation(
      (path: string) => mockFilesAndFolders.find((f) => f.path === path) || null
    );
    // testApp.isDesktopApp is handled by the Platform mock used in createMockApp

    modal = new FolderTagModal(testPlugin, onSubmitCallback);

    // Spy on modal methods
    vi.spyOn(modal, 'close');
  });

  describe('UI Initialization', () => {
    it('should create necessary UI elements on open using Setting mock', () => {
      modal.onOpen();

      const MockSettingClass = vi.mocked(Setting);
      expect(MockSettingClass).toHaveBeenCalledTimes(4);
      // ... other checks ...
    });

    it('should populate dropdown with folders', () => {
      modal.onOpen();
      expect(testApp.vault.getAllLoadedFiles).toHaveBeenCalled();
    });

    it('should display a list of folders', () => {
      const mockFolderList = createMockObsidianElement('div');

      (modal.contentEl as any).querySelector = vi.fn().mockReturnValue(mockFolderList);

      // Assuming onOpen calls renderFolderList, or call it directly for focused testing
      modal.onOpen();
      // If onOpen calls renderFolderList internally, this might be redundant
      // or call modal.renderFolderList() if it's a public method and onOpen doesn't set it up for this test.
      // For this pass, assuming onOpen is sufficient to trigger the logic that uses getAllLoadedFiles and populates the list.

      expect(testApp.vault.getAllLoadedFiles).toHaveBeenCalled();
      const listCreateEl = mockFolderList.createEl as Mock;
      expect(listCreateEl).toHaveBeenCalledWith('div', expect.objectContaining({ text: 'folder1' }));
      expect(listCreateEl).toHaveBeenCalledWith('div', expect.objectContaining({ text: 'folder2' }));
      expect(listCreateEl).not.toHaveBeenCalledWith('div', expect.objectContaining({ text: 'test.md' }));
    });
  });

  describe('Folder Selection', () => {
    it('should handle folder selection', () => {
      modal.onOpen(); // Ensure modal is set up

      const folderItem1 = createMockObsidianElement('div', { cls: 'folder-item', text: 'folder1' });
      folderItem1.dataset['path'] = 'folder1';
      const folderItem2 = createMockObsidianElement('div', { cls: 'folder-item', text: 'folder2' });
      folderItem2.dataset['path'] = 'folder2';

      const privateModal = modal as any;

      privateModal.folderItems = [folderItem1, folderItem2];

      privateModal.handleFolderClick({ currentTarget: folderItem1 } as unknown as MouseEvent);
      expect(folderItem1.classList.contains('selected')).toBe(true);
      expect(folderItem2.classList.contains('selected')).toBe(false);
      expect(privateModal.selectedFolderPath).toBe('folder1');

      privateModal.handleFolderClick({ currentTarget: folderItem2 } as unknown as MouseEvent);
      expect(folderItem1.classList.contains('selected')).toBe(false);
      expect(folderItem2.classList.contains('selected')).toBe(true);
      expect(privateModal.selectedFolderPath).toBe('folder2');
    });

    it('should handle folder search', () => {
      modal.onOpen();

      const privateModal = modal as any;

      const items = [
        createMockObsidianElement('div', { textContent: 'folder1' }),
        createMockObsidianElement('div', { textContent: 'subfolder' }),
        createMockObsidianElement('div', { textContent: 'folder2' }),
      ];
      privateModal.folderItems = items;

      const searchInput = createMockObsidianElement('input') as unknown as HTMLInputElement;
      privateModal.searchInput = searchInput;

      searchInput.value = 'folder1';
      privateModal.handleFolderSearch({ target: searchInput } as unknown as Event);
      expect(items[0]?.style.display).toBe('');
      expect(items[1]?.style.display).toBe('none');
      expect(items[2]?.style.display).toBe('none');

      searchInput.value = '';
      privateModal.handleFolderSearch({ target: searchInput } as unknown as Event);
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
      }) as unknown as HTMLInputElement;
      privateModal.includeSubfoldersCheckbox.checked = true;
      privateModal.close = vi.fn(); // Mock the close method

      const selectedFolder = { path: 'folder1', name: 'folder1', isFolder: () => true } as unknown as TFolder;
      // Ensure testApp.vault.getAbstractFileByPath is used if the modal re-fetches the folder
      testApp.vault.getAbstractFileByPath = vi.fn().mockReturnValue(selectedFolder);

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
      }) as unknown as HTMLInputElement;
      privateModal.includeSubfoldersCheckbox.checked = false;
      privateModal.close = vi.fn();

      const selectedFolder = { path: 'folder1', name: 'folder1', isFolder: () => true } as unknown as TFolder;
      testApp.vault.getAbstractFileByPath = vi.fn().mockReturnValue(selectedFolder);

      privateModal.handleTagButtonClick();

      expect(onSubmitCallback).toHaveBeenCalledWith(expect.objectContaining({ path: 'folder1' }), false);
    });
  });

  describe('Cancel Operation', () => {
    it('should close modal when Cancel button is clicked', () => {
      modal.onOpen();
      const MockSettingClass = vi.mocked(Setting);
      // Assuming the 4th Setting call is the one that adds the cancel button
      const cancelButtonSettingInstance = MockSettingClass.mock.results[3]?.value as unknown as Setting;

      // Check if the instance and addButton mock exist before proceeding
      const addButtonMock = vi.mocked(cancelButtonSettingInstance.addButton);
      const cancelButtonConfigFn = addButtonMock.mock.calls[0]?.[0];

      const mockCancelButton = {
        setButtonText: vi.fn().mockReturnThis(),
        onClick: vi.fn().mockImplementation((cb: () => void) => {
          // Simulate the button's onClick calling the provided callback
          cb();
          return mockCancelButton; // Return this for chaining if any
        }),
      } as unknown as ButtonComponent;

      modal.close = vi.fn(); // Ensure modal.close is a mock before it's called

      if (cancelButtonConfigFn) {
        cancelButtonConfigFn(mockCancelButton);
        // The onClick of the mockCancelButton should have been called, which in turn calls modal.close
        expect(modal.close).toHaveBeenCalled();
      } else {
        // This case means addButton was called, but not with a config function, or the mock setup is unexpected.
        throw new Error('Test setup check: Cancel button config function not found in addButton mock calls.');
      }
    });
  });
});
