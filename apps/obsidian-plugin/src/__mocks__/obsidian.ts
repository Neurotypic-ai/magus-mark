import { TFolder, Workspace } from 'obsidian';
import { vi } from 'vitest';

import ObsidianMagicPlugin from '../main';
import { createMockManifest } from '../testing/createMockManifest';
import { MetadataCache } from './obsidian/MetadataCache';
import { Setting } from './obsidian/Setting';
import { Vault } from './obsidian/Vault';

import type {
  App as AppType,
  Component as ComponentType,
  EventRef,
  Events as EventsType,
  FileManager as FileManagerType,
  KeymapEventHandler as KeymapEventHandlerType,
  KeymapEventListener as KeymapEventListenerType,
  Keymap as KeymapType,
  Menu as MenuType,
  MetadataCache as MetadataCacheType,
  Modifier as ModifierType,
  PluginManifest as PluginManifestType,
  Plugin as PluginType,
  Scope as ScopeType,
  UserEvent as UserEventType,
  Vault as VaultType,
  WorkspaceLeaf as WorkspaceLeafType,
  Workspace as WorkspaceType,
} from 'obsidian';
import type { Mock } from 'vitest';

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
    this.vault = new Vault() as VaultType;
    this.workspace = new Workspace() as WorkspaceType;
    this.metadataCache = new MetadataCache() as MetadataCacheType;
    this.Setting = Setting;

    this.keymap = {
      pushScope: vi.fn(),
      popScope: vi.fn(),
    };
    this.scope = {
      register: vi.fn<
        (modifiers: ModifierType[] | null, key: string | null, func: KeymapEventListenerType) => KeymapEventHandlerType
      >(() => ({ scope: this.scope }) as KeymapEventHandlerType),
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

  loadLocalStorage: Mock<() => Promise<null>> = vi.fn().mockResolvedValue(null);
  saveLocalStorage: Mock<() => void> = vi.fn();
}

export function createMockApp(): App {
  return new App();
}

export function createMockedPlugin(): ObsidianMagicPlugin {
  const mockApp = createMockApp();
  const manifest = createMockManifest() as PluginManifestType;
  return new ObsidianMagicPlugin(mockApp, manifest);
}

// --- Add common Obsidian UI components to the mock ---
export class Notice {
  message: string;
  duration: number;
  constructor(message: string, duration: number = 0) {
    this.message = message;
    this.duration = duration;
  }
  hide: Mock<() => void> = vi.fn();
}

export class Events implements EventsType {
  on: Mock<(name: string, callback: (...data: any[]) => any, ctx?: any) => EventRef> = vi.fn(() => ({
    ctx: null,
    callback: vi.fn(),
    name: '',
    unsubscribe: vi.fn(),
  }));
  off: Mock<(name: string, callback: (...data: any[]) => any) => void> = vi.fn();
  offref: Mock<(ref: EventRef) => void> = vi.fn();
  trigger: Mock<(name: string, ...data: any[]) => void> = vi.fn();
  tryTrigger: Mock<(name: string, ...data: any[]) => boolean> = vi.fn(() => false);
  onPaneMenu: Mock<(menu: MenuType, source: string) => void> = vi.fn();
}

export class Component extends Events implements ComponentType {
  constructor() {
    super();
  }
  load: Mock<() => void> = vi.fn();
  onload: Mock<() => void> = vi.fn();
  unload: Mock<() => void> = vi.fn();
  onunload: Mock<() => void> = vi.fn();
  addChild: <T extends ComponentType>(component: T) => T = vi.fn(
    <T extends ComponentType>(component: T): T => component
  );
  removeChild: <T extends ComponentType>(component: T) => T = vi.fn(
    <T extends ComponentType>(component: T): T => component
  );
  register: Mock<(cb: () => any) => void> = vi.fn((cb) => cb());
  registerEvent: Mock<(ref: EventRef) => void> = vi.fn();
  registerDomEvent: Mock<
    (el: EventTarget, type: string, callback: (evt: any) => any, options?: boolean | AddEventListenerOptions) => void
  > = vi.fn();
  registerInterval: Mock<(id: number) => number> = vi.fn((id) => id || window.setInterval(vi.fn(), 1000));
}

export class Modal extends Component {
  app: AppType;
  contentEl: HTMLElement;
  titleEl: HTMLElement;
  modalEl: HTMLElement;
  scope: ScopeType;

  constructor(app: AppType) {
    super();
    this.app = app;
    this.contentEl = typeof document !== 'undefined' ? document.createElement('div') : ({ style: {} } as HTMLElement);
    this.titleEl = typeof document !== 'undefined' ? document.createElement('h2') : ({ style: {} } as HTMLElement);
    this.modalEl = typeof document !== 'undefined' ? document.createElement('div') : ({ style: {} } as HTMLElement);
    this.scope = app.scope;
  }
  open: Mock<() => void> = vi.fn();
  close: Mock<() => void> = vi.fn();
  onOpen: Mock<() => void> = vi.fn();
  onClose: Mock<() => void> = vi.fn();
}

export class View extends Component {
  app: AppType;
  icon: string = 'any-icon';
  navigation: boolean = false;
  leaf: WorkspaceLeafType;
  containerEl: HTMLElement;
  scope: ScopeType;

  constructor(leaf: WorkspaceLeafType) {
    super();
    this.leaf = leaf;
    this.app = (leaf as any).app;
    this.containerEl = typeof document !== 'undefined' ? document.createElement('div') : ({ style: {} } as HTMLElement);
    this.scope = {
      register: vi.fn(),
      unregister: vi.fn(),
    } as ScopeType;
  }

  getViewType: Mock<() => string> = vi.fn(() => 'mock-view');
  getDisplayText: Mock<() => string> = vi.fn(() => 'Mock View');
  getIcon: Mock<() => string> = vi.fn(() => this.icon);
  getState: Mock<() => any> = vi.fn(() => ({}));
  setState: Mock<(state: any, result: any) => Promise<void>> = vi.fn(() => Promise.resolve());
  onResize: Mock<() => void> = vi.fn();
  onHeaderMenu: Mock<(menu: any) => void> = vi.fn();
  onOpen: () => Promise<void> = vi.fn(async (): Promise<void> => {});
  onClose: () => Promise<void> = vi.fn(async (): Promise<void> => {});
  getEphemeralState: Mock<() => any> = vi.fn(() => ({}));
  setEphemeralState: Mock<(state: any) => void> = vi.fn();
  onPaneMenu: Mock<(menu: MenuType, source: string) => void> = vi.fn();
}

export class ItemView extends View {
  constructor(leaf: WorkspaceLeafType) {
    super(leaf);
    this.contentEl = typeof document !== 'undefined' ? document.createElement('div') : ({ style: {} } as HTMLElement);
    if (typeof document !== 'undefined' && this.containerEl && this.contentEl) {
      this.containerEl.appendChild(this.contentEl);
    }
  }
  contentEl: HTMLElement;

  override getViewType: Mock<() => string> = vi.fn().mockReturnValue('mock-item-view');
  override getDisplayText: Mock<() => string> = vi.fn().mockReturnValue('Mock Item View');
}

export class PluginSettingTab extends Component {
  app: AppType;
  plugin: PluginType;
  containerEl: HTMLElement;

  constructor(app: AppType, plugin: PluginType) {
    super();
    this.app = app;
    this.plugin = plugin;
    this.containerEl = typeof document !== 'undefined' ? document.createElement('div') : ({ style: {} } as HTMLElement);
  }
  display: Mock<() => void> = vi.fn();
  hide: Mock<() => void> = vi.fn();
}
// --- End common Obsidian UI components ---

export { TFile, TFolder } from 'obsidian';
