import { vi } from 'vitest';

import { Modal, Notice, Plugin, Setting, createMockApp } from '../__mocks__/obsidian';
import MagusMarkPlugin, { DEFAULT_SETTINGS } from '../main';

import type { App, PluginManifest } from 'obsidian';

// Test manifest for consistent testing
export const TEST_MANIFEST: PluginManifest = {
  id: 'test-magus-mark',
  name: 'Test Magus Mark',
  version: '1.0.0',
  minAppVersion: '0.15.0',
  description: 'Test plugin',
  author: 'Test',
  authorUrl: 'https://test.com',
  isDesktopOnly: false,
};

// Enhanced plugin test factory
export function createTestPlugin(
  app?: App,
  manifest?: PluginManifest,
  overrides?: Partial<MagusMarkPlugin>
): MagusMarkPlugin {
  // Use enhanced mock system
  const testApp = app || createMockApp();
  const testManifest = manifest || TEST_MANIFEST;

  // Create plugin instance using the enhanced Plugin mock
  const plugin = new MagusMarkPlugin(testApp, testManifest);

  // Ensure all plugin methods are properly spied
  const spyMethods = [
    'onload',
    'onunload',
    'loadData',
    'saveData',
    'addCommand',
    'registerView',
    'addSettingTab',
    'addRibbonIcon',
    'addStatusBarItem',
  ];

  spyMethods.forEach((method) => {
    if (typeof plugin[method] === 'function') {
      vi.spyOn(plugin, method as keyof MagusMarkPlugin);
    }
  });

  // Apply any overrides
  if (overrides) {
    Object.assign(plugin, overrides);
  }

  return plugin;
}

// Helper to create a plugin that's already loaded
export async function createLoadedTestPlugin(
  app?: App,
  manifest?: PluginManifest,
  overrides?: Partial<MagusMarkPlugin>
): Promise<MagusMarkPlugin> {
  const plugin = createTestPlugin(app, manifest, overrides);

  // Mock loadData to return default settings
  vi.spyOn(plugin, 'loadData').mockResolvedValue(DEFAULT_SETTINGS);

  // Call onload to initialize services
  await plugin.onload();

  return plugin;
}

// Helper to reset all plugin mocks
export function resetPluginMocks(): void {
  vi.clearAllMocks();

  // Reset the mock constructors
  vi.mocked(Plugin).mockClear();
  vi.mocked(Setting).mockClear();
  vi.mocked(Modal).mockClear();
  vi.mocked(Notice).mockClear();
}
