import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ObsidianMagicPlugin from '../src/main';
import { TagManagementView, TAG_MANAGEMENT_VIEW_TYPE } from '../src/ui/TagManagementView';
import { TagVisualizationView, TAG_VISUALIZATION_VIEW_TYPE } from '../src/ui/TagVisualizationView';
import { FolderTagModal } from '../src/ui/FolderTagModal';
import { DocumentTagService } from '../src/services/DocumentTagService';
import { KeyManager } from '../src/services/KeyManager';
import { TaggingService } from '../src/services/TaggingService';
import type { App, TFile, TFolder, WorkspaceLeaf } from 'obsidian';

// Mock Obsidian API
vi.mock('obsidian', () => {
  const mockApp = {
    workspace: {
      onLayoutReady: vi.fn().mockImplementation((callback) => {
        callback();
        return { unsubscribe: vi.fn() };
      }),
      on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      getLeavesOfType: vi.fn().mockReturnValue([]),
      detachLeavesOfType: vi.fn(),
      getRightLeaf: vi.fn().mockReturnValue({
        setViewState: vi.fn().mockResolvedValue(undefined)
      }),
      revealLeaf: vi.fn(),
      getActiveFile: vi.fn().mockReturnValue({
        path: 'test/document.md',
        basename: 'document',
        extension: 'md'
      })
    },
    vault: {
      on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      getMarkdownFiles: vi.fn().mockReturnValue([
        {
          path: 'file1.md',
          basename: 'file1',
          extension: 'md'
        },
        {
          path: 'file2.md',
          basename: 'file2',
          extension: 'md'
        }
      ])
    },
    metadataCache: {
      on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
    }
  };

  return {
    App: vi.fn().mockImplementation(() => mockApp),
    Plugin: vi.fn().mockImplementation(function() {
      this.addRibbonIcon = vi.fn().mockReturnValue(document.createElement('div'));
      this.addStatusBarItem = vi.fn().mockReturnValue(document.createElement('div'));
      this.addCommand = vi.fn();
      this.registerView = vi.fn();
      this.addSettingTab = vi.fn();
      this.loadData = vi.fn().mockResolvedValue({});
      this.saveData = vi.fn().mockResolvedValue(undefined);
      this.app = mockApp;
      this.registerEvent = vi.fn().mockImplementation((event) => event);
    }),
    PluginSettingTab: vi.fn().mockImplementation(function() {
      this.display = vi.fn();
      this.containerEl = {
        empty: vi.fn(),
        createEl: vi.fn(),
        addEventListener: vi.fn()
      };
    }),
    Setting: vi.fn().mockImplementation(function() {
      return {
        setName: vi.fn().mockReturnThis(),
        setDesc: vi.fn().mockReturnThis(),
        addText: vi.fn().mockImplementation((cb) => {
          cb({
            setValue: vi.fn(),
            inputEl: document.createElement('input'),
            onChange: vi.fn().mockReturnThis()
          });
          return this;
        }),
        addDropdown: vi.fn().mockImplementation((cb) => {
          cb({
            setValue: vi.fn(),
            onChange: vi.fn().mockReturnThis()
          });
          return this;
        }),
        addToggle: vi.fn().mockImplementation((cb) => {
          cb({
            setValue: vi.fn(),
            onChange: vi.fn().mockReturnThis()
          });
          return this;
        }),
        then: vi.fn().mockImplementation((cb) => {
          cb(this);
          return this;
        })
      };
    }),
    Notice: vi.fn(),
    TFile: vi.fn(),
    TFolder: vi.fn()
  };
});

// Mock service modules
vi.mock('../src/services/DocumentTagService', () => ({
  DocumentTagService: vi.fn().mockImplementation(() => ({
    processEditorChanges: vi.fn(),
    applyTags: vi.fn().mockResolvedValue(true),
    extractExistingTags: vi.fn().mockReturnValue({})
  }))
}));

vi.mock('../src/services/KeyManager', () => ({
  KeyManager: vi.fn().mockImplementation(() => ({
    loadKey: vi.fn().mockResolvedValue('test-api-key'),
    saveKey: vi.fn().mockResolvedValue(undefined),
    deleteKey: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../src/services/TaggingService', () => ({
  TaggingService: vi.fn().mockImplementation(() => ({
    updateApiKey: vi.fn(),
    processFile: vi.fn().mockResolvedValue({
      success: true,
      data: {
        domain: 'software-development',
        subdomains: ['coding', 'documentation'],
        lifeAreas: ['learning'],
        conversationType: 'tutorial',
        contextualTags: ['obsidian-plugin', 'markdown'],
        year: '2023'
      }
    }),
    processFiles: vi.fn().mockImplementation((files) => 
      Promise.all(files.map(() => ({
        success: true,
        data: {
          domain: 'software-development',
          subdomains: ['coding', 'documentation']
        }
      })))
    ),
    updateModelPreference: vi.fn()
  }))
}));

vi.mock('../src/ui/TagManagementView', () => ({
  TAG_MANAGEMENT_VIEW_TYPE: 'tag-management-view',
  TagManagementView: vi.fn().mockImplementation(() => ({
    onOpen: vi.fn(),
    onClose: vi.fn()
  }))
}));

vi.mock('../src/ui/TagVisualizationView', () => ({
  TAG_VISUALIZATION_VIEW_TYPE: 'tag-visualization-view',
  TagVisualizationView: vi.fn().mockImplementation(() => ({
    onOpen: vi.fn(),
    onClose: vi.fn()
  }))
}));

vi.mock('../src/ui/FolderTagModal', () => ({
  FolderTagModal: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn()
  }))
}));

describe('ObsidianMagicPlugin', () => {
  let plugin: ObsidianMagicPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = new ObsidianMagicPlugin();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('onload', () => {
    it('should initialize the plugin correctly', async () => {
      await plugin.onload();

      // Check that services are initialized
      expect(KeyManager).toHaveBeenCalledWith(plugin);
      expect(TaggingService).toHaveBeenCalledWith(plugin);
      expect(DocumentTagService).toHaveBeenCalledWith(plugin);

      // Check that views are registered
      expect(plugin.registerView).toHaveBeenCalledWith(
        TAG_MANAGEMENT_VIEW_TYPE,
        expect.any(Function)
      );
      expect(plugin.registerView).toHaveBeenCalledWith(
        TAG_VISUALIZATION_VIEW_TYPE,
        expect.any(Function)
      );

      // Check that commands are added
      expect(plugin.addCommand).toHaveBeenCalledTimes(4);

      // Check that ribbon icon is added (default setting is true)
      expect(plugin.addRibbonIcon).toHaveBeenCalled();

      // Check that status bar is added (default setting is 'always')
      expect(plugin.addStatusBarItem).toHaveBeenCalled();
    });

    it('should load settings correctly', async () => {
      // Mock custom settings data
      plugin.loadData = vi.fn().mockResolvedValue({
        apiKey: 'custom-api-key',
        modelPreference: 'gpt-3.5-turbo',
        showRibbonIcon: false,
        statusBarDisplay: 'never'
      });

      await plugin.onload();

      // Check that settings are loaded
      expect(plugin.loadData).toHaveBeenCalled();
      expect(plugin.settings.apiKey).toBe('custom-api-key');
      expect(plugin.settings.modelPreference).toBe('gpt-3.5-turbo');
      expect(plugin.settings.showRibbonIcon).toBe(false);
      expect(plugin.settings.statusBarDisplay).toBe('never');

      // Check that ribbon icon is not added when setting is false
      expect(plugin.addRibbonIcon).not.toHaveBeenCalled();

      // Check that status bar is not added when setting is 'never'
      expect(plugin.addStatusBarItem).not.toHaveBeenCalled();
    });
  });

  describe('onunload', () => {
    it('should clean up resources on unload', async () => {
      await plugin.onload();
      plugin.onunload();

      // Check that views are detached
      expect(plugin.app.workspace.detachLeavesOfType).toHaveBeenCalledWith(TAG_MANAGEMENT_VIEW_TYPE);
      expect(plugin.app.workspace.detachLeavesOfType).toHaveBeenCalledWith(TAG_VISUALIZATION_VIEW_TYPE);
    });
  });

  describe('settings management', () => {
    it('should save settings correctly', async () => {
      await plugin.onload();
      await plugin.saveSettings();

      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });

    it('should update API key correctly', async () => {
      await plugin.onload();

      // Change API key
      plugin.settings.apiKey = 'new-api-key';
      await plugin.saveSettings();

      expect(plugin.saveData).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'new-api-key'
        })
      );
    });
  });

  describe('view management', () => {
    it('should activate tag management view correctly', async () => {
      await plugin.onload();

      // Mock getLeavesOfType to return empty array first (no existing view)
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

      await plugin.activateTagManagementView();

      // Check that right leaf is used
      expect(plugin.app.workspace.getRightLeaf).toHaveBeenCalledWith(false);
      
      // Check that view state is set correctly
      expect(plugin.app.workspace.getRightLeaf().setViewState).toHaveBeenCalledWith({
        type: TAG_MANAGEMENT_VIEW_TYPE,
        active: true
      });
    });

    it('should use existing leaf if tag management view is already open', async () => {
      await plugin.onload();

      // Mock existing view
      const mockLeaf = { id: 'existing-leaf' };
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      await plugin.activateTagManagementView();

      // Check that existing leaf is revealed
      expect(plugin.app.workspace.revealLeaf).toHaveBeenCalledWith(mockLeaf);
      
      // Check that new leaf is not created
      expect(plugin.app.workspace.getRightLeaf).not.toHaveBeenCalled();
    });

    it('should activate tag visualization view correctly', async () => {
      await plugin.onload();

      // Mock getLeavesOfType to return empty array first (no existing view)
      plugin.app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

      await plugin.activateTagVisualizationView();

      // Check that right leaf is used
      expect(plugin.app.workspace.getRightLeaf).toHaveBeenCalledWith(false);
      
      // Check that view state is set correctly
      expect(plugin.app.workspace.getRightLeaf().setViewState).toHaveBeenCalledWith({
        type: TAG_VISUALIZATION_VIEW_TYPE,
        active: true
      });
    });
  });

  describe('tagging operations', () => {
    it('should tag current file correctly', async () => {
      await plugin.onload();

      // Mock active file
      const mockFile = {
        path: 'test/document.md',
        basename: 'document',
        extension: 'md'
      } as TFile;
      plugin.app.workspace.getActiveFile = vi.fn().mockReturnValue(mockFile);

      await plugin.tagCurrentFile();

      // Check that tagging service is called
      expect(plugin.taggingService.processFile).toHaveBeenCalledWith(mockFile);
    });

    it('should open folder tag modal correctly', async () => {
      await plugin.onload();

      plugin.openFolderTagModal();

      // Check that modal is created and opened
      expect(FolderTagModal).toHaveBeenCalledWith(plugin.app, plugin);
      expect(FolderTagModal.mock.results[0].value.open).toHaveBeenCalled();
    });

    it('should tag folder correctly', async () => {
      await plugin.onload();

      // Mock folder with files
      const mockFolder = {
        path: 'test',
        name: 'test',
        isFolder: () => true
      } as unknown as TFolder;

      // Mock files in the folder
      const mockFiles = [
        { path: 'test/file1.md', extension: 'md' },
        { path: 'test/file2.md', extension: 'md' }
      ] as TFile[];
      plugin.app.vault.getMarkdownFiles = vi.fn().mockReturnValue(mockFiles);

      await plugin.tagFolder(mockFolder);

      // Check that tagging service is called for each file
      expect(plugin.taggingService.processFiles).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ path: 'test/file1.md' }),
          expect.objectContaining({ path: 'test/file2.md' })
        ]),
        expect.any(Function)
      );
    });
  });

  describe('context menu', () => {
    it('should register file context menu correctly', async () => {
      await plugin.onload();

      // Get the file-menu callback
      const callback = plugin.app.workspace.on.mock.calls.find(
        call => call[0] === 'file-menu'
      )[1];

      // Create mock menu and file
      const mockMenu = {
        addItem: vi.fn().mockImplementation(cb => {
          const mockItem = {
            setTitle: vi.fn().mockReturnThis(),
            setIcon: vi.fn().mockReturnThis(),
            onClick: vi.fn().mockReturnThis()
          };
          cb(mockItem);
          return mockItem;
        })
      };

      // Test with markdown file
      const mockFile = { extension: 'md' };
      callback(mockMenu, mockFile);

      // Check that menu item is added
      expect(mockMenu.addItem).toHaveBeenCalled();
      const menuItem = mockMenu.addItem.mock.results[0].value;
      expect(menuItem.setTitle).toHaveBeenCalledWith('Tag with Obsidian Magic');
      expect(menuItem.setIcon).toHaveBeenCalledWith('tag');

      // Test with folder
      const mockFolder = { isFolder: () => true };
      vi.clearAllMocks();
      callback(mockMenu, mockFolder);

      // Check that menu item is added
      expect(mockMenu.addItem).toHaveBeenCalled();
      const folderMenuItem = mockMenu.addItem.mock.results[0].value;
      expect(folderMenuItem.setTitle).toHaveBeenCalledWith('Tag folder with Obsidian Magic');
    });

    it('should register editor context menu correctly', async () => {
      await plugin.onload();

      // Get the editor-menu callback
      const callback = plugin.app.workspace.on.mock.calls.find(
        call => call[0] === 'editor-menu'
      )[1];

      // Create mock menu, editor, and view
      const mockMenu = {
        addItem: vi.fn().mockImplementation(cb => {
          const mockItem = {
            setTitle: vi.fn().mockReturnThis(),
            setIcon: vi.fn().mockReturnThis(),
            onClick: vi.fn().mockReturnThis()
          };
          cb(mockItem);
          return mockItem;
        })
      };
      const mockEditor = {};
      const mockView = {
        file: {
          path: 'test/document.md',
          extension: 'md'
        }
      };

      callback(mockMenu, mockEditor, mockView);

      // Check that menu item is added
      expect(mockMenu.addItem).toHaveBeenCalled();
      const menuItem = mockMenu.addItem.mock.results[0].value;
      expect(menuItem.setTitle).toHaveBeenCalledWith('Tag with Obsidian Magic');
      expect(menuItem.setIcon).toHaveBeenCalledWith('tag');

      // Test onClick handler
      const onClickHandler = menuItem.onClick.mock.calls[0][0];
      onClickHandler();

      // Check that tagging service is called
      expect(plugin.taggingService.processFile).toHaveBeenCalledWith(mockView.file);
    });
  });
}); 
