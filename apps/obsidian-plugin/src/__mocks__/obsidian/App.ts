import { vi } from 'vitest';

import { MetadataCache } from './MetadataCache';
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
    processFrontMatter: vi.fn(),
    generateMarkdownLink: vi.fn(),
  };

  constructor() {
    // Initialize app components
  }
}
