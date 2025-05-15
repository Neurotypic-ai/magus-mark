import { App } from 'obsidian';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ObsidianMagicPlugin, { DEFAULT_SETTINGS } from './main';
import { DocumentTagService } from './services/DocumentTagService';
import { KeyManager } from './services/KeyManager';
import { TaggingService } from './services/TaggingService';
import { TAG_MANAGEMENT_VIEW_TYPE } from './ui/TagManagementView';
import { TAG_VISUALIZATION_VIEW_TYPE } from './ui/TagVisualizationView';

import type { PluginManifest } from 'obsidian';

// Mock electron AFTER other imports
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/app/path'),
  },
  ipcRenderer: {
    invoke: vi.fn(),
  },
}));

// mockAppInstance is used to construct the plugin. Its methods are vi.fn().
const mockAppInstance = {
  vault: {
    getAllLoadedFiles: vi.fn().mockReturnValue([]),
    getAbstractFileByPath: vi.fn().mockReturnValue(null),
    on: vi.fn(() => ({ unsubscribe: vi.fn() })), // Added on for consistency
  },
  workspace: {
    detachLeavesOfType: vi.fn(),
    onLayoutReady: vi.fn((cb) => cb()), // Added for consistency
    on: vi.fn(() => ({ unsubscribe: vi.fn() })),
  },
  metadataCache: {
    // Added for consistency
    on: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getFileCache: vi.fn().mockReturnValue(null),
  },
};

// Local vi.mock('obsidian', ...) IS REMOVED.
// Vitest will use apps/obsidian-plugin/src/__mocks__/obsidian.ts automatically.

// Mock service dependencies
vi.mock('./services/TaggingService', () => ({
  TaggingService: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue({ isOk: () => true }),
    processSingleFile: vi.fn().mockResolvedValue({ isOk: () => true, value: { status: 'success', tags: {} } }),
    processMultipleFiles: vi.fn().mockResolvedValue([]),
    updateApiKey: vi.fn(),
    // Ensure all methods used by plugin.taggingService are mocked
  })),
}));
vi.mock('./services/DocumentTagService', () => ({
  DocumentTagService: vi.fn(() => ({
    // Ensure all methods used by plugin.documentTagService are mocked
  })),
}));
vi.mock('./services/KeyManager', () => ({
  KeyManager: vi.fn(() => ({
    loadKey: vi.fn().mockResolvedValue('mock-api-key'),
    // Ensure all methods used by plugin.keyManager are mocked
  })),
}));

// Mock UI components that are constructed (not just types)
// If TAG_MANAGEMENT_VIEW_TYPE is just a string, no mock needed for its import.
// If TagManagementView itself is instantiated via new TagManagementView(), its module needs mocking.
// The current mocks for views are for their constructor and type constant.
vi.mock('./ui/settings/SettingTab'); // Assumes SettingTab is new SettingTab(plugin.app, plugin)

// If TAG_MANAGEMENT_VIEW_TYPE or TAG_VISUALIZATION_VIEW_TYPE are complex objects, they might need specific mocks.
// For now, assuming they are string constants as used in assertions.
// vi.mock('./ui/TagManagementView', () => ({
//   TagManagementView: vi.fn(), // If constructor is called
//   TAG_MANAGEMENT_VIEW_TYPE: 'mock-tag-management-view-type', // Keep if used as string ID
// }));
// vi.mock('./ui/TagVisualizationView', () => ({
//   TagVisualizationView: vi.fn(), // If constructor is called
//   TAG_VISUALIZATION_VIEW_TYPE: 'tag-visualization-view', // Keep if used as string ID
// }));
vi.mock('./ui/FolderTagModal'); // Assumes new FolderTagModal(...)

const mockManifest: PluginManifest = {
  id: 'magus-mark',
  name: 'Magus Mark',
  version: '0.1.0',
  minAppVersion: '0.15.0',
  author: 'Test Author',
  description: 'Test Description',
};

describe('ObsidianMagicPlugin', () => {
  let plugin: ObsidianMagicPlugin;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create plugin instance with the pre-defined mockAppInstance
    plugin = new ObsidianMagicPlugin(mockAppInstance as unknown as App, mockManifest);

    vi.spyOn(plugin, 'loadData').mockResolvedValue({ ...DEFAULT_SETTINGS });
    vi.spyOn(plugin, 'saveData').mockResolvedValue(undefined);

    vi.spyOn(plugin, 'addRibbonIcon');
    vi.spyOn(plugin, 'registerView');
    vi.spyOn(plugin, 'addCommand');
    vi.spyOn(plugin, 'addSettingTab');
    vi.spyOn(plugin, 'registerEvent');
    vi.spyOn(plugin, 'registerEditorExtension');
    vi.spyOn(plugin, 'addStatusBarItem');

    plugin.openFolderTagModal = vi.fn();
    plugin.tagCurrentFile = vi.fn();
    plugin.tagFolder = vi.fn();

    // Re-initialize mocked services on the plugin instance as its constructor would
    plugin.keyManager = new (vi.mocked(KeyManager))(plugin);
    plugin.taggingService = new (vi.mocked(TaggingService))(plugin);
    plugin.documentTagService = new (vi.mocked(DocumentTagService))(plugin);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load settings on initialization', async () => {
    await plugin.onload();
    expect(plugin.loadData).toHaveBeenCalled();
    expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should initialize services on load', async () => {
    await plugin.onload();
    expect(KeyManager).toHaveBeenCalledWith(plugin);
    expect(TaggingService).toHaveBeenCalledWith(plugin);
    expect(DocumentTagService).toHaveBeenCalledWith(plugin);
  });

  it('should add ribbon icon based on settings', async () => {
    await plugin.onload();
    expect(plugin.addRibbonIcon).toHaveBeenCalledWith(expect.any(String), 'Open Tag Management', expect.any(Function));

    vi.mocked(plugin.loadData).mockResolvedValueOnce({ ...DEFAULT_SETTINGS, showRibbonIcon: false });
    // Create a new plugin instance for settings change or re-run onload if settings are dynamic
    const pluginWithNewSettings = new ObsidianMagicPlugin(mockAppInstance as unknown as App, mockManifest);
    vi.spyOn(pluginWithNewSettings, 'loadData').mockResolvedValue({ ...DEFAULT_SETTINGS, showRibbonIcon: false });
    vi.spyOn(pluginWithNewSettings, 'addRibbonIcon'); // Spy on the new instance
    await pluginWithNewSettings.onload();
    expect(pluginWithNewSettings.addRibbonIcon).not.toHaveBeenCalled();
  });

  it('should register views', async () => {
    await plugin.onload();
    // These string constants must match exactly what the plugin uses.
    expect(plugin.registerView).toHaveBeenCalledWith(TAG_MANAGEMENT_VIEW_TYPE, expect.any(Function));
    expect(plugin.registerView).toHaveBeenCalledWith(TAG_VISUALIZATION_VIEW_TYPE, expect.any(Function));
  });

  it('should add commands', async () => {
    await plugin.onload();
    expect(plugin.addCommand).toHaveBeenCalledTimes(4); // Assuming 4 commands are added
    expect(plugin.addCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'tag-current-file' }));
  });

  it('should add setting tab', async () => {
    await plugin.onload();
    expect(plugin.addSettingTab).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should add status bar item based on settings', async () => {
    await plugin.onload();
    expect(plugin.addStatusBarItem).toHaveBeenCalled();
    vi.clearAllMocks(); // Clear mocks before re-testing with new settings

    const pluginNeverStatusBar = new ObsidianMagicPlugin(mockAppInstance as unknown as App, mockManifest);
    vi.spyOn(pluginNeverStatusBar, 'loadData').mockResolvedValueOnce({
      ...DEFAULT_SETTINGS,
      statusBarDisplay: 'never',
    });
    vi.spyOn(pluginNeverStatusBar, 'addStatusBarItem');
    await pluginNeverStatusBar.onload();
    expect(pluginNeverStatusBar.addStatusBarItem).not.toHaveBeenCalled();
    vi.clearAllMocks();

    const pluginErrorStatusBar = new ObsidianMagicPlugin(mockAppInstance as unknown as App, mockManifest);
    vi.spyOn(pluginErrorStatusBar, 'loadData').mockResolvedValueOnce({
      ...DEFAULT_SETTINGS,
      statusBarDisplay: 'errors',
    });
    vi.spyOn(pluginErrorStatusBar, 'addStatusBarItem');
    await pluginErrorStatusBar.onload();
    expect(pluginErrorStatusBar.addStatusBarItem).toHaveBeenCalled();
  });

  it('should handle onunload correctly', async () => {
    await plugin.onload();
    plugin.onunload();
    expect(mockAppInstance.workspace.detachLeavesOfType).toHaveBeenCalledWith(TAG_MANAGEMENT_VIEW_TYPE);
    expect(mockAppInstance.workspace.detachLeavesOfType).toHaveBeenCalledWith(TAG_VISUALIZATION_VIEW_TYPE);
  });
});
