import { vi } from 'vitest';

import { createMockObsidianElement } from '../testing/createMockObsidianElement';
import { MetadataCache } from './obsidian/MetadataCache';
import { Modal } from './obsidian/Modal';
import { Setting } from './obsidian/Setting';
import { Vault } from './obsidian/Vault';
import { Workspace } from './obsidian/Workspace';

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
  Scope as ScopeType,
  UserEvent as UserEventType,
  Vault as VaultType,
  WorkspaceLeaf as WorkspaceLeafType,
  Workspace as WorkspaceType,
} from 'obsidian';
import type { Mock } from 'vitest';

import type { MockObsidianElement } from './obsidian/MockObsidianElement';

// Mock type for ObsidianMagicPlugin to avoid circular dependency
interface MockObsidianMagicPlugin {
  app: AppType;
  settings: any;
  [key: string]: any;
}

// Mock implementations for Obsidian file system classes
export class TAbstractFile {
  path: string;
  name: string;
  parent: TFolder | null;
  vault: any;

  constructor() {
    this.path = '';
    this.name = '';
    this.parent = null;
    this.vault = null;
  }
}

export class TFile extends TAbstractFile {
  basename: string;
  extension: string;
  stat: { mtime: number; ctime: number; size: number };

  constructor() {
    super();
    this.basename = '';
    this.extension = 'md';
    this.stat = { mtime: Date.now(), ctime: Date.now(), size: 0 };
  }
}

export class TFolder extends TAbstractFile {
  children: (TFile | TFolder)[];
  isRoot: () => boolean;

  constructor() {
    super();
    this.children = [];
    this.isRoot = vi.fn(() => this.path === '/');
  }
}

export { Modal };

// Mock Notice class for UI notifications - make it a function that can be spied on
export const Notice: new (
  message: string,
  timeout?: number
) => {
  message: string;
  timeout: number;
  setMessage: (message: string) => any;
  hide: () => void;
} = vi.fn().mockImplementation(function (this: any, message: string, timeout = 5000) {
  this.message = message;
  this.timeout = timeout;
  console.log(`[Mock Notice] ${message}`);

  this.setMessage = vi.fn((newMessage: string) => {
    this.message = newMessage;
    return this;
  });

  this.hide = vi.fn();
});

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
  isDesktopApp: boolean = Platform.isDesktopApp;
  createElement: Mock<(tagName: string) => MockObsidianElement>;

  constructor() {
    this.vault = new Vault() as VaultType;
    this.workspace = new Workspace() as WorkspaceType;
    this.metadataCache = new MetadataCache() as MetadataCacheType;
    this.Setting = Setting;
    this.createElement = vi.fn((tagName: string) => createMockObsidianElement(tagName as any));

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

export function createMockedPlugin(): MockObsidianMagicPlugin {
  const mockApp = createMockApp();
  return {
    app: mockApp,
    settings: {},
  };
}

// --- Add common Obsidian UI components to the mock ---

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
  registerInterval: Mock<(id: number) => number> = vi.fn((id) => id || window.setInterval(vi.fn(), 1000));
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
}

export class View extends Component {
  app: AppType;
  icon: string = 'any-icon';
  navigation: boolean = false;
  leaf: WorkspaceLeafType;
  containerEl: MockObsidianElement;
  scope: ScopeType;

  constructor(leaf: WorkspaceLeafType) {
    super();
    this.leaf = leaf;
    this.app = (leaf as any).app;
    this.containerEl = createMockObsidianElement('div');
    this.scope = {
      register: vi.fn(),
      unregister: vi.fn(),
    } as ScopeType;
  }

  // Define abstract methods that child classes should override
  getViewType(): string {
    return 'mock-view';
  }

  getDisplayText(): string {
    return 'Mock View';
  }

  getIcon(): string {
    return this.icon;
  }

  getState(): any {
    return {};
  }

  setState(_state: any, _result: any): Promise<void> {
    return Promise.resolve();
  }

  onResize(): void {
    // Default implementation
  }

  onHeaderMenu(_menu: any): void {
    // Default implementation
  }

  async onOpen(): Promise<void> {
    // Default implementation
  }

  async onClose(): Promise<void> {
    // Default implementation
  }

  getEphemeralState(): any {
    return {};
  }

  setEphemeralState(_state: any): void {
    // Default implementation
  }
}

export class ItemView extends View {
  contentEl: MockObsidianElement;

  constructor(leaf: WorkspaceLeafType) {
    super(leaf);
    this.contentEl = createMockObsidianElement('div');
    if (this.containerEl && this.contentEl) {
      this.containerEl.appendChild(this.contentEl);
    }

    // ItemView does NOT override any methods - let child classes provide their own implementations
  }
}

// --- End common Obsidian UI components ---

export { WorkspaceLeaf } from './obsidian/WorkspaceLeaf';
export { Plugin } from './obsidian/Plugin';
export { PluginSettingTab } from './obsidian/PluginSettingTab';
export { Setting } from './obsidian/Setting';
export { Workspace } from './obsidian/Workspace';
