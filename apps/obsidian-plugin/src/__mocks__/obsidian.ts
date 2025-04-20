import { TFolder, Workspace } from 'obsidian';
import { vi } from 'vitest';

import ObsidianMagicPlugin from '../main';
import { createMockManifest } from './createMockManifest';
import { MetadataCache } from './obsidian/MetadataCache';
import { Setting } from './obsidian/Setting';
import { Vault } from './obsidian/Vault';

import type {
  App as AppType,
  FileManager as FileManagerType,
  KeymapEventHandler as KeymapEventHandlerType,
  KeymapEventListener as KeymapEventListenerType,
  Keymap as KeymapType,
  MetadataCache as MetadataCacheType,
  Modifier as ModifierType,
  Scope as ScopeType,
  UserEvent as UserEventType,
  Vault as VaultType,
  Workspace as WorkspaceType,
} from 'obsidian';

export const Platform = { isDesktopApp: true, isMobile: false }; // Default to desktop

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}
export class App implements AppType {
  __esModule = true;
  vault: VaultType;
  workspace: WorkspaceType;
  metadataCache: MetadataCacheType;
  keymap: KeymapType;
  scope: ScopeType;
  fileManager: FileManagerType;
  lastEvent: UserEventType | null;
  Setting: typeof Setting;

  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
    this.metadataCache = new MetadataCache();
    this.Setting = Setting;

    this.keymap = {
      pushScope: vi.fn(),
      popScope: vi.fn(),
    };
    this.scope = {
      register: vi.fn<[ModifierType[] | null, string | null, KeymapEventListenerType], KeymapEventHandlerType>(
        () => ({ scope: this.scope }) as KeymapEventHandlerType
      ),
      unregister: vi.fn(),
    };
    this.fileManager = {
      getNewFileParent: vi.fn().mockReturnValue(new TFolder()),
      renameFile: vi.fn().mockResolvedValue(undefined),
      trashFile: vi.fn().mockResolvedValue(undefined),
      generateMarkdownLink: vi.fn().mockReturnValue(''),
      processFrontMatter: vi.fn().mockResolvedValue(undefined),
      getAvailablePathForAttachment: vi.fn().mockResolvedValue(''),
    };
    this.lastEvent = null;
  }

  loadLocalStorage: () => Promise<null> = vi.fn().mockResolvedValue(null);
  saveLocalStorage: () => void = vi.fn();
}

export function createMockApp(): App {
  return new App();
}

export function createMockedPlugin(): ObsidianMagicPlugin {
  const mockApp = createMockApp();
  const manifest = createMockManifest();
  return new ObsidianMagicPlugin(mockApp, manifest);
}
