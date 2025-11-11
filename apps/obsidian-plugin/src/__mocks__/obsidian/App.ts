import { vi } from 'vitest';

import { MetadataCache } from './MetadataCache';
import { TFolder } from './TFile';
import { Vault } from './Vault';
import { Workspace } from './Workspace';

import type { App as AppType, KeymapEventHandler, Modifier, TAbstractFile, UserEvent } from 'obsidian';
import type { Mock } from 'vitest';

export class App implements Partial<AppType> {
  public vault: Vault = new Vault();
  public workspace: Workspace = new Workspace();
  public metadataCache: MetadataCache = new MetadataCache();
  public keymap: {
    pushScope: Mock<() => void>;
    popScope: Mock<() => void>;
  } = {
    pushScope: vi.fn(),
    popScope: vi.fn(),
  };
  public scope: {
    register: Mock<(modifiers: Modifier[] | null, key: string | null, func: () => void) => KeymapEventHandler>;
    unregister: Mock<(handler: KeymapEventHandler) => void>;
  };
  public fileManager: {
    getNewFileParent: Mock<() => TFolder>;
    renameFile: Mock<() => Promise<void>>;
    trashFile: Mock<() => Promise<void>>;
    generateMarkdownLink: Mock<() => string>;
    processFrontMatter: Mock<() => Promise<void>>;
    getAvailablePathForAttachment: Mock<() => Promise<string>>;
    promptForDeletion: Mock<(file: TAbstractFile) => Promise<void>>;
  } = {
    getNewFileParent: vi.fn().mockReturnValue(new TFolder('')),
    renameFile: vi.fn().mockResolvedValue(undefined),
    trashFile: vi.fn().mockResolvedValue(undefined),
    generateMarkdownLink: vi.fn().mockReturnValue('[[test]]'),
    processFrontMatter: vi.fn().mockResolvedValue(undefined),
    getAvailablePathForAttachment: vi.fn().mockResolvedValue('test-path'),
    promptForDeletion: vi.fn().mockResolvedValue(undefined),
  };
  public lastEvent: UserEvent | null = null;
  public renderContext: {
    hoverPopover: null;
  } = {
    hoverPopover: null,
  };
  public isDarkMode = (): boolean => false;
  public loadLocalStorage = (_key: string): unknown => null;
  public saveLocalStorage = (_key: string, _data: unknown | null): void => {
    // Mock implementation
  };

  constructor() {
    // Initialize scope with proper mock that returns KeymapEventHandler
    // Create a temporary scope object first
    const tempScope = {} as AppType['scope'];
    const mockHandler: KeymapEventHandler = {
      scope: tempScope,
      modifiers: null,
      key: null,
    } as KeymapEventHandler;

    this.scope = {
      register: vi.fn().mockReturnValue(mockHandler),
      unregister: vi.fn(),
    };

    // Fix the circular reference by updating the handler's scope
    (mockHandler as { scope: AppType['scope'] }).scope = this.scope as unknown as AppType['scope'];
  }
}
