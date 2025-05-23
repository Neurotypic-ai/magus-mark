import { beforeEach, describe, expect, it, vi } from 'vitest';

import ObsidianMagicPlugin, { DEFAULT_SETTINGS } from './main';

import type { App, PluginManifest } from 'obsidian';

// Create a proper test manifest
const TEST_MANIFEST: PluginManifest = {
  id: 'test-magus-mark',
  name: 'Test Magus Mark',
  version: '1.0.0',
  minAppVersion: '0.15.0',
  description: 'Test plugin',
  author: 'Test',
  authorUrl: 'https://test.com',
  isDesktopOnly: false,
};

describe('ObsidianMagicPlugin', () => {
  let plugin: ObsidianMagicPlugin;
  let mockAppInstance: App;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { createMockApp } = await import('./__mocks__/obsidian');
    mockAppInstance = createMockApp();

    // Create plugin instance with proper types
    plugin = new ObsidianMagicPlugin(mockAppInstance as unknown as App, TEST_MANIFEST);

    // Allow the real onload to execute by setting up spies that don't interfere
    const originalLoadData = plugin.loadData.bind(plugin);
    const originalSaveData = plugin.saveData.bind(plugin);
    const originalAddSettingTab = plugin.addSettingTab.bind(plugin);
    const originalRegisterView = plugin.registerView.bind(plugin);
    const originalAddRibbonIcon = plugin.addRibbonIcon.bind(plugin);
    const originalAddStatusBarItem = plugin.addStatusBarItem.bind(plugin);
    const originalAddCommand = plugin.addCommand.bind(plugin);
    const originalRegisterEvent = plugin.registerEvent.bind(plugin);
    const originalRegisterMarkdownPostProcessor = plugin.registerMarkdownPostProcessor.bind(plugin);

    // Override methods with spies that still call through
    vi.spyOn(plugin, 'loadData').mockImplementation(async () => {
      // Call the real implementation but return our test data
      return DEFAULT_SETTINGS;
    });
    vi.spyOn(plugin, 'saveData').mockImplementation(async () => {
      return originalSaveData(plugin.settings);
    });
    vi.spyOn(plugin, 'addSettingTab').mockImplementation(originalAddSettingTab);
    vi.spyOn(plugin, 'registerView').mockImplementation(originalRegisterView);
    vi.spyOn(plugin, 'addRibbonIcon').mockImplementation(originalAddRibbonIcon);
    vi.spyOn(plugin, 'addStatusBarItem').mockImplementation(() => {
      return {
        createEl: vi.fn().mockReturnValue({
          createEl: vi.fn(),
          addClass: vi.fn(),
          setText: vi.fn(),
          setAttr: vi.fn(),
        }),
        addClass: vi.fn(),
        setText: vi.fn(),
        setAttr: vi.fn(),
      } as unknown as HTMLElement;
    });
    vi.spyOn(plugin, 'addCommand').mockImplementation(originalAddCommand);
    vi.spyOn(plugin, 'registerEvent').mockImplementation(originalRegisterEvent);
    vi.spyOn(plugin, 'registerMarkdownPostProcessor').mockImplementation(originalRegisterMarkdownPostProcessor);
  });

  it('should load settings on initialization', async () => {
    await plugin.onload();
    expect(plugin.loadData).toHaveBeenCalled();
    expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should initialize services on load', async () => {
    await plugin.onload();

    // Verify services were created and assigned
    expect(plugin.keyManager).toBeDefined();
    expect(plugin.taggingService).toBeDefined();
    expect(plugin.documentTagService).toBeDefined();
  });

  it('should add ribbon icon based on settings', async () => {
    await plugin.onload();
    expect(plugin.addRibbonIcon).toHaveBeenCalledWith('tag', 'Magus Mark', expect.any(Function));

    // Test with ribbon icon disabled
    const pluginNoRibbon = new ObsidianMagicPlugin(mockAppInstance as unknown as App, TEST_MANIFEST);
    pluginNoRibbon.loadData = vi.fn().mockResolvedValue({ ...DEFAULT_SETTINGS, showRibbonIcon: false });
    pluginNoRibbon.addRibbonIcon = vi.fn();
    pluginNoRibbon.addSettingTab = vi.fn();
    pluginNoRibbon.registerView = vi.fn();
    pluginNoRibbon.addStatusBarItem = vi.fn().mockReturnValue({
      createEl: vi.fn(),
      addClass: vi.fn(),
      setText: vi.fn(),
      setAttr: vi.fn(),
    } as unknown as HTMLElement);
    pluginNoRibbon.addCommand = vi.fn();
    pluginNoRibbon.registerEvent = vi.fn();
    pluginNoRibbon.registerMarkdownPostProcessor = vi.fn();

    await pluginNoRibbon.onload();
    expect(pluginNoRibbon.addRibbonIcon).not.toHaveBeenCalled();
  });

  it('should register views', async () => {
    await plugin.onload();
    expect(plugin.registerView).toHaveBeenCalledWith('magus-mark-tag-management', expect.any(Function));
    expect(plugin.registerView).toHaveBeenCalledWith('magus-mark-tag-visualization', expect.any(Function));
  });

  it('should add commands', async () => {
    await plugin.onload();
    expect(plugin.addCommand).toHaveBeenCalledTimes(4);
    expect(plugin.addCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'tag-current-file' }));
  });

  it('should add setting tab', async () => {
    await plugin.onload();
    expect(plugin.addSettingTab).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should add status bar item based on settings', async () => {
    await plugin.onload();
    expect(plugin.addStatusBarItem).toHaveBeenCalled();

    // Test with status bar disabled
    const pluginNoStatus = new ObsidianMagicPlugin(mockAppInstance as unknown as App, TEST_MANIFEST);
    pluginNoStatus.loadData = vi.fn().mockResolvedValue({ ...DEFAULT_SETTINGS, statusBarDisplay: 'never' });
    pluginNoStatus.addStatusBarItem = vi.fn();
    pluginNoStatus.addRibbonIcon = vi.fn();
    pluginNoStatus.addSettingTab = vi.fn();
    pluginNoStatus.registerView = vi.fn();
    pluginNoStatus.addCommand = vi.fn();
    pluginNoStatus.registerEvent = vi.fn();
    pluginNoStatus.registerMarkdownPostProcessor = vi.fn();

    await pluginNoStatus.onload();
    expect(pluginNoStatus.addStatusBarItem).not.toHaveBeenCalled();
  });

  it('should handle onunload correctly', async () => {
    await plugin.onload();
    plugin.onunload();
    expect(mockAppInstance.workspace.detachLeavesOfType).toHaveBeenCalledWith('magus-mark-tag-management');
    expect(mockAppInstance.workspace.detachLeavesOfType).toHaveBeenCalledWith('magus-mark-tag-visualization');
  });
});
