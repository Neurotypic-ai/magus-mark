import { describe, it, expect, vi, beforeEach } from 'vitest';
import ObsidianMagicPlugin from '../src/main';

// Create mock App with all required properties
const mockApp = {
  workspace: {
    getActiveFile: vi.fn(),
    on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    detachLeavesOfType: vi.fn(),
    getLeaf: vi.fn().mockReturnValue({
      setViewState: vi.fn().mockResolvedValue(undefined),
      getViewState: vi.fn().mockReturnValue({}),
    }),
    rightSplit: {
      collapsed: false,
    },
  },
  vault: {
    getMarkdownFiles: vi.fn().mockReturnValue([]),
    read: vi.fn().mockResolvedValue(''),
    modify: vi.fn().mockResolvedValue(undefined),
  },
  // Add missing required App properties
  metadataCache: { on: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) },
  fileManager: { processFrontMatter: vi.fn() },
  keymap: {},
  scope: {},
};

// Mock plugin manifest with all required properties
const mockManifest = {
  id: 'obsidian-magic',
  name: 'Obsidian Magic',
  version: '0.1.0',
  minAppVersion: '1.5.0',
  description: 'AI-powered tagging system for organizing AI chat history in Obsidian',
  author: 'Obsidian Magic Team',
  authorUrl: 'https://github.com/obsidian-magic/obsidian-magic',
};

// Create a proper Plugin base class mock
class MockPlugin {
  app: any;
  manifest: any;

  constructor(app: any, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  addRibbonIcon = vi.fn().mockReturnValue({ remove: vi.fn() });
  addStatusBarItem = vi.fn().mockReturnValue({ remove: vi.fn(), setText: vi.fn(), addClass: vi.fn() });
  addCommand = vi.fn().mockReturnValue({ remove: vi.fn() });
  registerView = vi.fn().mockReturnValue({ remove: vi.fn() });
  addSettingTab = vi.fn().mockReturnValue({ remove: vi.fn() });
  registerEvent = vi.fn().mockReturnValue({ remove: vi.fn() });
  loadData = vi.fn().mockResolvedValue({});
  saveData = vi.fn().mockResolvedValue(undefined);
}

// Mock the Obsidian API
vi.mock('obsidian', () => {
  return {
    Plugin: MockPlugin,
    PluginSettingTab: vi.fn().mockImplementation(() => ({
      display: vi.fn()
    })),
    TFile: vi.fn().mockImplementation((path) => ({
      path,
      basename: path.split('/').pop()?.split('.')[0] || '',
      extension: path.split('.').pop() || '',
    })),
    TFolder: vi.fn().mockImplementation((path) => ({
      path,
      name: path.split('/').pop() || '',
      children: [],
    })),
    Notice: vi.fn(),
    Setting: vi.fn().mockImplementation(() => ({
      setName: vi.fn().mockReturnThis(),
      setDesc: vi.fn().mockReturnThis(),
      addText: vi.fn().mockReturnThis(),
      addDropdown: vi.fn().mockReturnThis(),
      addToggle: vi.fn().mockReturnThis(),
      addButton: vi.fn().mockReturnThis(),
    })),
    App: vi.fn().mockImplementation(() => mockApp),
  };
});

describe('ObsidianMagicPlugin', () => {
  let plugin: ObsidianMagicPlugin;

  beforeEach(() => {
    // Create a new plugin instance with the required constructor arguments
    plugin = new ObsidianMagicPlugin(mockApp, mockManifest);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should initialize properly', async () => {
    await plugin.onload();
    expect(plugin.taggingService).toBeDefined();
    expect(plugin.documentTagService).toBeDefined();
    expect(plugin.keyManager).toBeDefined();
  });

  it('should clean up on unload', async () => {
    await plugin.onload();
    await plugin.onunload();
    expect(mockApp.workspace.detachLeavesOfType).toHaveBeenCalledTimes(2);
  });

  it('should save and load settings', async () => {
    await plugin.loadSettings();
    await plugin.saveSettings();
    expect(plugin.loadData).toHaveBeenCalled();
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
  });

  it('should activate tag management view', async () => {
    await plugin.onload();
    await plugin.activateTagManagementView();
    expect(mockApp.workspace.getLeaf).toHaveBeenCalled();
  });
}); 