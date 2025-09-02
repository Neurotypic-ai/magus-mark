import { vi } from 'vitest';

import { MetadataCache } from './MetadataCache';
import { TFolder } from './TFile';
import { Vault } from './Vault';
import { Workspace } from './Workspace';

import type { App as AppType } from 'obsidian';

export class App implements Partial<AppType> {
  public vault: Vault = new Vault();
  public workspace: Workspace = new Workspace();
  public metadataCache: MetadataCache = new MetadataCache();
  public keymap = {
    pushScope: vi.fn(),
    popScope: vi.fn(),
  };
  public scope = {
    register: vi.fn(),
    unregister: vi.fn(),
  };
  public fileManager = {
    getNewFileParent: vi.fn().mockReturnValue(new TFolder('')),
    renameFile: vi.fn().mockResolvedValue(undefined),
    trashFile: vi.fn().mockResolvedValue(undefined),
    generateMarkdownLink: vi.fn().mockReturnValue('[[test]]'),
    processFrontMatter: vi.fn().mockResolvedValue(undefined),
    getAvailablePathForAttachment: vi.fn().mockReturnValue('test-path'),
  };

  constructor() {
    // Initialize app components
  }
}
