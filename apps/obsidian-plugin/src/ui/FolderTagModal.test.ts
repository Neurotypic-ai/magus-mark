import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockObsidianElement } from '../testing/createMockObsidianElement';
import { createTestPlugin, resetPluginMocks } from '../testing/createTestPlugin';
import { FolderTagModal } from './FolderTagModal';

import type { TAbstractFile, TFolder } from 'obsidian';

import type MagusMarkPlugin from '../main';

describe('FolderTagModal', () => {
  let modal: FolderTagModal;
  let testPlugin: MagusMarkPlugin;
  let onSubmitCallback: any;
  let mockFilesAndFolders: TAbstractFile[];

  beforeEach(async () => {
    // Reset all mocks to ensure clean state
    resetPluginMocks();

    // Set up test data
    onSubmitCallback = vi.fn();
    mockFilesAndFolders = [
      {
        path: 'folder1',
        name: 'folder1',
        parent: null,
        children: [],
        isFolder: () => true,
      } as unknown as TFolder,
      {
        path: 'folder2',
        name: 'folder2',
        parent: null,
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

    // Create test plugin with mock app
    const { createMockApp } = await import('../__mocks__/obsidian');
    const testApp = createMockApp();
    testPlugin = createTestPlugin(testApp);

    // Mock vault methods
    vi.spyOn(testApp.vault, 'getAllLoadedFiles').mockReturnValue(mockFilesAndFolders);
    vi.spyOn(testApp.vault, 'getAbstractFileByPath').mockImplementation(
      (path: string) => mockFilesAndFolders.find((f) => f.path === path) || null
    );

    modal = new FolderTagModal(testPlugin, onSubmitCallback);

    // Spy on modal methods
    vi.spyOn(modal, 'close');
  });

  describe('UI Initialization', () => {
    it('should create necessary UI elements on open using Setting mock', async () => {
      const { Setting } = await import('obsidian');

      modal.onOpen();

      // Verify Setting constructor was called (for folder selection, search, etc.)
      expect(Setting).toHaveBeenCalled();
      expect(vi.mocked(Setting)).toHaveBeenCalledTimes(4);
    });

    it('should populate dropdown with folders', () => {
      modal.onOpen();
      expect(testPlugin.app.vault.getAllLoadedFiles).toHaveBeenCalled();
    });

    it('should display a list of folders', () => {
      const mockFolderList = createMockObsidianElement('div');

      (modal.contentEl as any).querySelector = vi.fn().mockReturnValue(mockFolderList);

      modal.onOpen();

      expect(testPlugin.app.vault.getAllLoadedFiles).toHaveBeenCalled();
      const listCreateEl = mockFolderList.createEl as any;
      expect(listCreateEl).toHaveBeenCalledWith('div', expect.objectContaining({ text: 'folder1' }));
      expect(listCreateEl).toHaveBeenCalledWith('div', expect.objectContaining({ text: 'folder2' }));
      expect(listCreateEl).not.toHaveBeenCalledWith('div', expect.objectContaining({ text: 'test.md' }));
    });
  });

  describe('Folder Selection', () => {
    it('should handle folder selection', () => {
      modal.onOpen();

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
      privateModal.close = vi.fn();

      const selectedFolder = { path: 'folder1', name: 'folder1', isFolder: () => true } as unknown as TFolder;
      testPlugin.app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(selectedFolder);

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
      testPlugin.app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(selectedFolder);

      privateModal.handleTagButtonClick();

      expect(onSubmitCallback).toHaveBeenCalledWith(expect.objectContaining({ path: 'folder1' }), false);
    });
  });

  describe('Cancel Operation', () => {
    it('should close modal when Cancel button is clicked', async () => {
      const { Setting } = await import('obsidian');

      modal.onOpen();

      // Verify Setting constructor was called
      expect(vi.mocked(Setting)).toHaveBeenCalledTimes(4);

      // Get the cancel button setting instance (4th call result)
      const cancelButtonSetting = vi.mocked(Setting).mock.instances[3];
      expect(cancelButtonSetting).toBeDefined();

      if (!cancelButtonSetting) {
        throw new Error('Cancel button setting should be defined');
      }

      // Get the button component from the addButton call
      const addButtonMock = vi.mocked(cancelButtonSetting.addButton);
      expect(addButtonMock).toHaveBeenCalled();

      // Get the button configuration function
      const buttonConfigFn = addButtonMock.mock.calls[0]?.[0];
      expect(buttonConfigFn).toBeDefined();

      // Create a mock button component that stores the click callback
      const mockCancelButton = {
        setButtonText: vi.fn().mockReturnThis(),
        onClick: vi.fn().mockImplementation((cb: () => void) => {
          // Store the callback for manual triggering
          mockCancelButton._clickCallback = cb;
          return mockCancelButton;
        }),
        _clickCallback: undefined as (() => void) | undefined,
        triggerClick: () => {
          if (mockCancelButton._clickCallback) {
            mockCancelButton._clickCallback();
          }
        },
      } as any;

      modal.close = vi.fn();

      // Execute the button configuration function
      if (buttonConfigFn) {
        buttonConfigFn(mockCancelButton);

        // Trigger the click callback manually
        mockCancelButton.triggerClick();

        expect(modal.close).toHaveBeenCalled();
      }
    });
  });
});
