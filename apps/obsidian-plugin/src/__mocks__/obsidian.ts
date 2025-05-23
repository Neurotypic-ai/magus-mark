import { App } from './obsidian/App';

// Re-export all mock classes from their individual files
export { App } from './obsidian/App';
export { Component } from './obsidian/Component';
export { Events } from './obsidian/Events';
export { ItemView } from './obsidian/ItemView';
export { Modal } from './obsidian/Modal';
export { Notice } from './obsidian/Notice';
export { Plugin } from './obsidian/Plugin';
export { PluginSettingTab } from './obsidian/PluginSettingTab';
export { Setting } from './obsidian/Setting';
export { TAbstractFile, TFile, TFolder } from './obsidian/TFile';
export { Vault } from './obsidian/Vault';
export { View } from './obsidian/View';
export { Workspace } from './obsidian/Workspace';
export { WorkspaceLeaf } from './obsidian/WorkspaceLeaf';

// Utility functions
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export const Platform = {
  isDesktop: true,
  isMobile: false,
  isDesktopApp: true,
  isMobileApp: false,
  isIosApp: false,
  isAndroidApp: false,
  isPhone: false,
  isTablet: false,
  isMacOS: true,
  isWin: false,
  isLinux: false,
  isSafari: false,
  resourcePathPrefix: 'app://mock-id/',
};

// Factory functions
export function createMockApp(): App {
  return new App();
}

export function createMockedPlugin(): { app: App; settings: Record<string, unknown> } {
  const mockApp = createMockApp();
  return {
    app: mockApp,
    settings: {},
  };
}
