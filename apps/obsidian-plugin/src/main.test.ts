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
}));

// Use our shared Obsidian API mock
vi.mock('obsidian');

// Mock service dependencies
vi.mock('./services/TaggingService', () => ({
  TaggingService: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue({ isOk: () => true }),
    processSingleFile: vi.fn().mockResolvedValue({ isOk: () => true, value: { status: 'success', tags: {} } }),
    processMultipleFiles: vi.fn().mockResolvedValue([]),
    updateApiKey: vi.fn(),
  })),
}));
vi.mock('./services/DocumentTagService', () => ({
  DocumentTagService: vi.fn(() => ({
    // Add mocks for methods used by Plugin if any
  })),
}));
vi.mock('./services/KeyManager', () => ({
  KeyManager: vi.fn(() => ({
    loadKey: vi.fn().mockResolvedValue('mock-api-key'),
  })),
}));

// Mock UI components
vi.mock('./ui/settings/SettingTab');
vi.mock('./ui/TagManagementView', () => ({
  TagManagementView: vi.fn(),
  TAG_MANAGEMENT_VIEW_TYPE: 'mock-tag-management-view-type',
}));
vi.mock('./ui/TagVisualizationView', () => ({
  TagVisualizationView: vi.fn(),
  TAG_VISUALIZATION_VIEW_TYPE: 'tag-visualization-view', // Use actual exported constant name
}));
vi.mock('./ui/FolderTagModal');

// Use the shared App stub
const mockApp = new App();

const mockManifest: PluginManifest = {
  id: 'magus-mark',
  name: 'Magus Mark',
  version: '0.1.0',
  minAppVersion: '0.15.0', // Add missing properties
  author: 'Test Author', // Add missing properties
  description: 'Test Description', // Add missing properties
};

describe('ObsidianMagicPlugin', () => {
  let plugin: ObsidianMagicPlugin;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create plugin instance
    plugin = new ObsidianMagicPlugin(mockApp, mockManifest);

    // Spy on load/save
    vi.spyOn(plugin, 'loadData').mockResolvedValue({ ...DEFAULT_SETTINGS });
    vi.spyOn(plugin, 'saveData').mockResolvedValue(undefined);

    // Spy on plugin UI-registration methods instead of stubbing
    vi.spyOn(plugin, 'addRibbonIcon');
    vi.spyOn(plugin, 'registerView');
    vi.spyOn(plugin, 'addCommand');
    vi.spyOn(plugin, 'addSettingTab');
    vi.spyOn(plugin, 'registerEvent');
    vi.spyOn(plugin, 'registerEditorExtension');
    vi.spyOn(plugin, 'addStatusBarItem');

    // Stub modals and file commands to avoid side effects
    plugin.openFolderTagModal = vi.fn();
    plugin.tagCurrentFile = vi.fn();
    plugin.tagFolder = vi.fn();

    // Initialize mocked services (assuming plugin creates them)
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
    // Check if services were created (or init methods called if applicable)
    expect(KeyManager).toHaveBeenCalledWith(plugin);
    expect(TaggingService).toHaveBeenCalledWith(plugin);
    expect(DocumentTagService).toHaveBeenCalledWith(plugin);
  });

  it('should add ribbon icon based on settings', async () => {
    // Default setting is true
    await plugin.onload();
    expect(plugin.addRibbonIcon).toHaveBeenCalledWith(expect.any(String), 'Open Tag Management', expect.any(Function));

    // Test when false
    vi.mocked(plugin.loadData).mockResolvedValueOnce({ ...DEFAULT_SETTINGS, showRibbonIcon: false });
    await plugin.onload(); // Re-run onload with new settings
    expect(plugin.addRibbonIcon).not.toHaveBeenCalled(); // Check it wasn't called this time
  });

  it('should register views', async () => {
    await plugin.onload();
    expect(plugin.registerView).toHaveBeenCalledWith(TAG_MANAGEMENT_VIEW_TYPE, expect.any(Function));
    expect(plugin.registerView).toHaveBeenCalledWith(TAG_VISUALIZATION_VIEW_TYPE, expect.any(Function));
  });

  it('should add commands', async () => {
    await plugin.onload();
    // Check how many commands are expected
    expect(plugin.addCommand).toHaveBeenCalledTimes(4);
    // Optionally check specific commands
    expect(plugin.addCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'tag-current-file' }));
  });

  it('should add setting tab', async () => {
    await plugin.onload();
    expect(plugin.addSettingTab).toHaveBeenCalledWith(expect.any(Object)); // Check instance of SettingTab mock
  });

  it('should add status bar item based on settings', async () => {
    // Default is 'always'
    await plugin.onload();
    expect(plugin.addStatusBarItem).toHaveBeenCalled();
    vi.clearAllMocks(); // Clear mocks for next check

    // Test 'never'
    vi.mocked(plugin.loadData).mockResolvedValueOnce({ ...DEFAULT_SETTINGS, statusBarDisplay: 'never' });
    await plugin.onload();
    expect(plugin.addStatusBarItem).not.toHaveBeenCalled();
    vi.clearAllMocks();

    // Test 'errors' (assuming status bar might be added but hidden initially)
    // This might require more complex mocking/checking if logic exists
    vi.mocked(plugin.loadData).mockResolvedValueOnce({ ...DEFAULT_SETTINGS, statusBarDisplay: 'errors' });
    await plugin.onload();
    expect(plugin.addStatusBarItem).toHaveBeenCalled(); // Check if it's added
  });

  it('should handle onunload correctly', async () => {
    await plugin.onload(); // Ensure plugin is loaded
    plugin.onunload();
    expect(mockApp.workspace.detachLeavesOfType).toHaveBeenCalledWith('tag-management-view');
    expect(mockApp.workspace.detachLeavesOfType).toHaveBeenCalledWith('tag-visualization-view');
    // Add checks for other cleanup if necessary
  });

  // Add more specific tests for commands, context menus, etc.
});
