import { beforeEach, describe, expect, it, vi } from 'vitest';

import MagusMarkPlugin, { DEFAULT_SETTINGS } from './main';
import { TEST_MANIFEST, createTestPlugin, resetPluginMocks } from './testing/createTestPlugin';

import type { App } from 'obsidian';

describe('MagusMarkPlugin', () => {
  let plugin: MagusMarkPlugin;
  let mockAppInstance: App;

  beforeEach(async () => {
    // Reset all mocks to ensure clean state
    resetPluginMocks();

    const { createMockApp } = await import('./__mocks__/obsidian');
    mockAppInstance = createMockApp();

    // Create plugin instance using our enhanced factory
    plugin = createTestPlugin(mockAppInstance, TEST_MANIFEST);
  });

  it('should load settings on initialization', async () => {
    // Mock loadData to return default settings
    vi.mocked(plugin.loadData).mockResolvedValue(DEFAULT_SETTINGS);

    await plugin.onload();

    expect(plugin.loadData).toHaveBeenCalled();
    expect(plugin.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should initialize services on load', async () => {
    // Mock loadData to return default settings
    vi.mocked(plugin.loadData).mockResolvedValue(DEFAULT_SETTINGS);

    console.log('Before onload, plugin.keyManager:', plugin.keyManager);
    console.log('Before onload, plugin.taggingService:', plugin.taggingService);

    try {
      await plugin.onload();
      console.log('onload completed successfully');
    } catch (error) {
      console.error('onload threw an error:', error);
      throw error; // Re-throw to fail the test
    }

    console.log('After onload, plugin.keyManager:', plugin.keyManager);
    console.log('After onload, plugin.taggingService:', plugin.taggingService);
    console.log('After onload, plugin.documentTagService:', plugin.documentTagService);

    // Verify services were created and assigned
    expect(plugin.keyManager).toBeDefined();
    expect(plugin.taggingService).toBeDefined();
    expect(plugin.documentTagService).toBeDefined();
  });

  it('should add ribbon icon based on settings', async () => {
    // Mock loadData to return default settings with ribbon enabled
    vi.mocked(plugin.loadData).mockResolvedValue({ ...DEFAULT_SETTINGS, showRibbonIcon: true });

    await plugin.onload();
    expect(plugin.addRibbonIcon).toHaveBeenCalledWith('tag', 'Magus Mark', expect.any(Function));

    // Test with ribbon icon disabled
    const pluginNoRibbon = createTestPlugin(mockAppInstance, TEST_MANIFEST);
    vi.mocked(pluginNoRibbon.loadData).mockResolvedValue({ ...DEFAULT_SETTINGS, showRibbonIcon: false });

    await pluginNoRibbon.onload();
    expect(pluginNoRibbon.addRibbonIcon).not.toHaveBeenCalled();
  });

  it('should register views', async () => {
    vi.mocked(plugin.loadData).mockResolvedValue(DEFAULT_SETTINGS);

    await plugin.onload();
    expect(plugin.registerView).toHaveBeenCalledWith('magus-mark-tag-management', expect.any(Function));
    expect(plugin.registerView).toHaveBeenCalledWith('magus-mark-tag-visualization', expect.any(Function));
  });

  it('should add commands', async () => {
    vi.mocked(plugin.loadData).mockResolvedValue(DEFAULT_SETTINGS);

    await plugin.onload();
    expect(plugin.addCommand).toHaveBeenCalledTimes(4);
    expect(plugin.addCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'tag-current-file' }));
  });

  it('should add setting tab', async () => {
    vi.mocked(plugin.loadData).mockResolvedValue(DEFAULT_SETTINGS);

    await plugin.onload();
    expect(plugin.addSettingTab).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should add status bar item based on settings', async () => {
    // Test with status bar enabled (default)
    vi.mocked(plugin.loadData).mockResolvedValue({ ...DEFAULT_SETTINGS, statusBarDisplay: 'always' });

    await plugin.onload();
    expect(plugin.addStatusBarItem).toHaveBeenCalled();

    // Test with status bar disabled
    const pluginNoStatus = createTestPlugin(mockAppInstance, TEST_MANIFEST);
    vi.mocked(pluginNoStatus.loadData).mockResolvedValue({ ...DEFAULT_SETTINGS, statusBarDisplay: 'never' });

    await pluginNoStatus.onload();
    expect(pluginNoStatus.addStatusBarItem).not.toHaveBeenCalled();
  });

  it('should handle onunload correctly', async () => {
    vi.mocked(plugin.loadData).mockResolvedValue(DEFAULT_SETTINGS);

    await plugin.onload();
    plugin.onunload();

    expect(mockAppInstance.workspace.detachLeavesOfType).toHaveBeenCalledWith('magus-mark-tag-management');
    expect(mockAppInstance.workspace.detachLeavesOfType).toHaveBeenCalledWith('magus-mark-tag-visualization');
  });
});
