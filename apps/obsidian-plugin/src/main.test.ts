import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ObsidianMagicPlugin, { DEFAULT_SETTINGS } from './main';
import { DocumentTagService } from './services/DocumentTagService';
import { KeyManager } from './services/KeyManager';
import { TaggingService } from './services/TaggingService';
import { TAG_MANAGEMENT_VIEW_TYPE } from './ui/TagManagementView';
import { TAG_VISUALIZATION_VIEW_TYPE } from './ui/TagVisualizationView';

import type { App, PluginManifest } from 'obsidian';

// Mock electron AFTER other imports
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/app/path'),
  },
}));

// Mock Obsidian API (basic structure - relies on obsidian alias in vitest.config.js)
vi.mock('obsidian', async (importOriginal) => {
  const original = await importOriginal<typeof import('obsidian')>();
  return {
    ...original, // Keep original exports
    // Override specific classes/functions needed for mocks if the alias isn't enough
    Notice: vi.fn(),
    // Example: If Setting isn't mocked correctly by alias
    // Setting: class MockSetting { ... },
  };
});

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

// Create fuller mock objects
const mockApp = {
  vault: {
    getMarkdownFiles: vi.fn().mockReturnValue([]),
    read: vi.fn().mockResolvedValue(''),
    modify: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(() => ({ unsubscribe: vi.fn() })),
    // Add other needed vault methods
  },
  workspace: {
    onLayoutReady: vi.fn((cb) => {
      cb();
      return { unsubscribe: vi.fn() };
    }),
    on: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getLeavesOfType: vi.fn().mockReturnValue([]),
    detachLeavesOfType: vi.fn(),
    getRightLeaf: vi.fn(() => ({
      id: 'mock-leaf',
      setViewState: vi.fn(),
      // Add other leaf properties/methods if needed
    })),
    revealLeaf: vi.fn(),
    getActiveFile: vi.fn().mockReturnValue(null),
    // Add other needed workspace methods
  },
  metadataCache: {
    on: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getFileCache: vi.fn().mockReturnValue(null),
    // Add other needed metadataCache methods
  },
  keymap: {},
  scope: {},
  fileManager: {},
  lastEvent: null,
} as unknown as App;

const mockManifest: PluginManifest = {
  id: 'obsidian-magic',
  name: 'Obsidian Magic',
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

    // Spy on methods AFTER instance creation if modifying instance behavior
    vi.spyOn(plugin, 'loadData').mockResolvedValue({ ...DEFAULT_SETTINGS });
    vi.spyOn(plugin, 'saveData').mockResolvedValue(undefined);
    plugin.addRibbonIcon = vi.fn(); // Mock methods directly on instance if needed
    plugin.registerView = vi.fn();
    plugin.addCommand = vi.fn();
    plugin.addSettingTab = vi.fn();
    plugin.registerEvent = vi.fn(() => ({ unsubscribe: vi.fn() }));
    plugin.registerEditorExtension = vi.fn();
    plugin.addStatusBarItem = vi.fn(() => document.createElement('div'));
    plugin.openFolderTagModal = vi.fn(); // Mock this method
    plugin.tagCurrentFile = vi.fn(); // Mock this method
    plugin.tagFolder = vi.fn(); // Mock this method

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
