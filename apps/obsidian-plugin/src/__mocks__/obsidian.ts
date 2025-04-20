import { TFolder } from 'obsidian';
import { vi } from 'vitest';

import ObsidianMagicPlugin from '../main';
import { createMockManifest } from './createMockManifest';
import { Component } from './obsidian/Component';
import { MetadataCache } from './obsidian/MetadataCache';
import { Events } from './obsidian/MockEvents';
import { createMockObsidianElement } from './obsidian/MockObsidianElement';
import { Setting } from './obsidian/Setting';
import { Vault } from './obsidian/Vault';
import { WorkspaceLeaf } from './obsidian/WorkspaceLeaf';

import type {
  Constructor,
  FileManager as FileManagerType,
  KeymapEventHandler as KeymapEventHandlerType,
  KeymapEventListener as KeymapEventListenerType,
  Keymap as KeymapType,
  MetadataCache as MetadataCacheType,
  Modifier as ModifierType,
  App as ObsidianAppType,
  PluginManifest as PluginManifestType,
  Plugin as PluginType,
  Scope as ScopeType,
  TFile,
  UserEvent as UserEventType,
  Vault as VaultType,
  View,
  WorkspaceLeaf as WorkspaceLeafType,
  WorkspaceMobileDrawer,
  WorkspaceRoot,
  WorkspaceSidedock,
  Workspace as WorkspaceType,
} from 'obsidian';

import type { MockObsidianElement } from './obsidian/MockObsidianElement';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

/** Minimal Platform stub */
export const Platform = { isDesktopApp: true, isMobile: false }; // Default to desktop

/** Minimal Workspace stub */
export class Workspace extends Events implements WorkspaceType {
  activeLeaf: WorkspaceLeafType | null = null;
  leftSplit: WorkspaceSidedock | WorkspaceMobileDrawer = {};
  rightSplit: WorkspaceSidedock | WorkspaceMobileDrawer = {};
  rootSplit: WorkspaceRoot = {};
  containerEl: MockObsidianElement = createMockObsidianElement('div');
  layoutReady = true;
  activeEditor: unknown = null;
  on(): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  }
  onLayoutReady(cb: () => void): void {
    cb();
  }
  getLeaf(): WorkspaceLeafType {
    if (!this.activeLeaf) {
      this.activeLeaf = new WorkspaceLeaf();
    }
    return this.activeLeaf;
  }
  getActiveViewOfType<T extends View>(type: Constructor<T>): T | null {
    return null;
  }
  getActiveFile(): TFile | null {
    return null;
  }
  revealLeaf(): Promise<void> {
    return Promise.resolve();
  }
  getLeavesOfType(): WorkspaceLeaf[] {
    return [];
  }
  detachLeavesOfType(): void {
    /* no-op for mock */
  }
  getRightLeaf: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  changeLayout: () => void = vi.fn().mockResolvedValue(undefined);
  getLayout: () => Record<string, unknown> = vi.fn().mockReturnValue({});
  createLeafInParent: () => WorkspaceLeaf = vi.fn().mockReturnValue(new WorkspaceLeaf());
  createLeafBySplit: () => WorkspaceLeaf = vi.fn().mockReturnValue(new WorkspaceLeaf());
  duplicateLeaf: () => Promise<WorkspaceLeaf> = vi.fn().mockResolvedValue(new WorkspaceLeaf());
  moveLeafToPopout: () => void = vi.fn();
  openPopoutLeaf: () => Promise<WorkspaceLeaf> = vi.fn().mockReturnValue(new WorkspaceLeaf());
  openLinkText: () => Promise<void> = vi.fn().mockResolvedValue(undefined);
  setActiveLeaf: () => void = vi.fn();
  getLeafById: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  getGroupLeaves: () => WorkspaceLeaf[] = vi.fn().mockReturnValue([]);
  getMostRecentLeaf: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  getLeftLeaf: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  ensureSideLeaf: () => Promise<WorkspaceLeaf> = vi.fn().mockResolvedValue(new WorkspaceLeaf());
  iterateRootLeaves: () => void = vi.fn();
  iterateAllLeaves: () => void = vi.fn();
  getLastOpenFiles: () => TFile[] = vi.fn().mockReturnValue([]);
  updateOptions: () => void = vi.fn();
}

/** Minimal Plugin base class stub */
export class Plugin extends Component implements PluginType {
  app: App;
  manifest: PluginManifestType;
  constructor(app: App, manifest: PluginManifestType) {
    super();
    this.app = app;
    this.app.vault = this.app.vault;
    this.app.workspace = this.app.workspace;
    this.app.metadataCache = this.app.metadataCache;
    this.manifest = manifest;
  }
  addCommand(): void {
    /* no-op for mock */
  }
  registerView(): void {
    /* no-op for mock */
  }
  addSettingTab(): void {
    /* no-op for mock */
  }
  loadData(): Promise<Record<string, unknown>> {
    return Promise.resolve({});
  }
  saveData(): Promise<void> {
    return Promise.resolve();
  }
  addRibbonIcon(): MockObsidianElement<'div'> {
    return createMockObsidianElement<'div'>('div');
  }
  addStatusBarItem(): MockObsidianElement<'div'> {
    const el = createMockObsidianElement<'div'>('div');
    // Spy on setText and addClass to preserve default behavior and enable assertions
    vi.spyOn(el, 'setText');
    vi.spyOn(el, 'addClass');
    return el;
  }
  registerEditorExtension(_extension: unknown): void {
    /* no-op for mock */
  }
}

// --- End Minimal Modal Stub ---

// --- Add Minimal Setting Stub --- (From FolderTagModal.test.ts)

// --- End Minimal Setting Stub ---

// Add other exports if needed by tests, e.g., utility functions
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

// Export commonly used types/interfaces if needed, though they are often just type hints
// export type TAbstractFile = TFile | TFolder;

// Minimal App stub for shared tests
export class App implements ObsidianAppType {
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

  loadLocalStorage = vi.fn().mockReturnValue(null);
  saveLocalStorage = vi.fn();
}

export function createMockApp(): AppType {
  return new App();
}

export function createMockedPlugin(): ObsidianMagicPlugin {
  const mockApp = createMockApp();
  const manifest = createMockManifest();
  return new ObsidianMagicPlugin(mockApp, manifest);
}
