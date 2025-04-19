import { vi } from 'vitest';

// This file provides minimal stubs for the 'obsidian' module
// allowing tests to run without needing the full Obsidian environment.

/** Minimal Notice stub */
export class Notice {
  constructor(public message: string | DocumentFragment) {}
  hide() {}
  setMessage(_message: string | DocumentFragment) {
    return this;
  }
}

/** Minimal TFolder stub */
export class TFolder {
  path = '';
  name = '';
  children: any[] = [];
  parent: TFolder | null = null;
  vault: any = {};
  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() ?? '';
  }
  isRoot() {
    return this.path === '/';
  }
}

/** Minimal TFile stub */
export class TFile {
  path = '';
  name = ''; // Added name property
  basename = '';
  extension = '';
  stat: any = { ctime: Date.now(), mtime: Date.now(), size: 0 };
  vault: any = {};
  parent: TFolder | null = null;
  constructor(init: Partial<TFile>) {
    Object.assign(this, init);
    this.name = init.path?.split('/').pop() ?? '';
    this.basename = this.name.replace(/\.md$/, '');
    this.extension = this.name.includes('.') ? (this.name.split('.').pop() ?? '') : '';

    // Ensure parent is correctly typed if path indicates it
    if (this.path && this.path !== '/' && this.path.includes('/')) {
      const parentPath = this.path.substring(0, this.path.lastIndexOf('/'));
      this.parent = new TFolder(parentPath || '/');
    }
  }
}

/** Minimal Platform stub */
export const Platform = { isDesktopApp: false, isMobile: false };

/** Minimal WorkspaceLeaf stub */
export class WorkspaceLeaf {
  id = `leaf-${Math.random()}`;
  view: any = null;
  parent: any = null;
  app: any = { vault: new Vault() }; // Basic app stub
  containerEl: any = {
    children: [
      { createEl: vi.fn(), addClass: vi.fn() }, // Header
      {
        // Content
        empty: vi.fn(),
        createEl: vi.fn().mockReturnThis(),
        createDiv: vi.fn().mockReturnThis(),
        addClass: vi.fn(),
        setText: vi.fn(), // Add setText
        children: [], // Add children array
        style: {}, // Add style object
      },
    ],
    empty: vi.fn(),
    createEl: vi.fn().mockReturnThis(),
    createDiv: vi.fn().mockReturnThis(),
    addClass: vi.fn(),
    doc: document,
    setText: vi.fn(), // Add setText
  };
  constructor() {}
  setViewState() {
    return Promise.resolve();
  }
  getEphemeralState() {
    return {};
  }
  setEphemeralState() {}
  openFile() {
    return Promise.resolve();
  }
  open() {
    return Promise.resolve(null);
  }
  getViewState() {
    return { type: '', state: {} };
  }
  togglePinned() {}
  setPinned() {}
  setGroupMember() {}
  setGroup() {}
  detach() {}
  getIcon() {
    return 'document';
  }
  getDisplayText() {
    return 'Mock Leaf';
  }
  onResize() {}
  isDeferred = false;
  loadIfDeferred() {
    return Promise.resolve();
  }
}

/** Minimal ItemView stub */
export class ItemView {
  app: any;
  icon: string = '';
  navigation: boolean = false;
  leaf: WorkspaceLeaf;
  containerEl: any;
  scope: any = null;
  constructor(leaf: WorkspaceLeaf) {
    this.leaf = leaf;
    this.containerEl = document.createElement('div') as any;
    this.containerEl.empty = vi.fn();
    this.containerEl.createEl = vi.fn((tag: string, options?: any) => {
      const el = document.createElement(tag);
      if (options?.text) el.textContent = options.text;
      if (options?.cls) el.className = options.cls;
      el.addClass = vi.fn();
      el.removeClass = vi.fn();
      el.toggleClass = vi.fn();
      el.setText = vi.fn();
      el.setAttr = vi.fn();
      el.createEl = this.containerEl.createEl;
      el.createDiv = vi.fn((opts) => this.containerEl.createEl('div', opts));
      el.empty = vi.fn();
      el.appendChild = vi.fn();
      el.remove = vi.fn();
      return el;
    });
    this.containerEl.createDiv = vi.fn((opts) => this.containerEl.createEl('div', opts));
    this.containerEl.addClass = vi.fn();
    this.containerEl.removeClass = vi.fn();
    this.containerEl.toggleClass = vi.fn();
    this.containerEl.setText = vi.fn();
    this.containerEl.setAttr = vi.fn();
    this.containerEl.appendChild = vi.fn();
    this.containerEl.removeChild = vi.fn();
    this.containerEl.children = [];
    this.containerEl.style = {};
    this.containerEl.doc = document;

    this.app = leaf.app;
  }
  getViewType() {
    return 'mock-item-view';
  }
  getState() {
    return {};
  }
  setState(_state: any, _result: any) {
    return Promise.resolve();
  }
  getEphemeralState() {
    return {};
  }
  setEphemeralState(_state: any) {}
  getIcon() {
    return this.icon;
  }
  onResize() {}
  getDisplayText() {
    return 'Mock Item View';
  }
  onPaneMenu() {}
  onOpen() {
    return Promise.resolve();
  }
  onClose() {
    return Promise.resolve();
  }
  registerDomEvent(_el: any, _type: string, _cb: any) {}
  addAction(_icon: string, _title: string, _cb: any) {
    return document.createElement('div');
  }
  load() {}
  onload() {}
  unload() {}
  onunload() {}
}

/** Minimal MetadataCache stub */
export class MetadataCache {
  on() {
    return { unsubscribe: () => {} };
  }
  getFileCache() {
    return null;
  }
  getCache() {
    return null;
  }
  fileToLinktext() {
    return '';
  }
  getFirstLinkpathDest() {
    return null;
  }
  resolvedLinks = {};
  unresolvedLinks = {};
}

/** Minimal Vault stub */
export class Vault {
  configDir = '.obsidian';
  adapter = {};
  on() {
    return { unsubscribe: () => {} };
  }
  getName() {
    return 'MockVault';
  }
  getFileByPath() {
    return null;
  }
  getFolderByPath() {
    return null;
  }
  getAbstractFileByPath(path: string): TFile | TFolder | null {
    // Basic implementation for testing
    if (path.endsWith('.md')) {
      return new TFile({ path });
    }
    // Assume folder if no extension or common non-md extensions
    if (!path.includes('.') || path.match(/\.\w+$/) === null || !['md'].includes(path.split('.').pop() ?? '')) {
      return new TFolder(path);
    }
    return null;
  }
  getRoot() {
    return new TFolder('/');
  }
  create() {
    return Promise.resolve(new TFile({ path: 'new.md' }));
  }
  createBinary() {
    return Promise.resolve(new TFile({ path: 'new.bin' }));
  }
  createFolder() {
    return Promise.resolve(new TFolder('new_folder'));
  }
  read() {
    return Promise.resolve('');
  }
  cachedRead() {
    return Promise.resolve('');
  }
  readBinary() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  getResourcePath() {
    return '';
  }
  delete() {
    return Promise.resolve();
  }
  trash() {
    return Promise.resolve();
  }
  rename() {
    return Promise.resolve();
  }
  modify() {
    return Promise.resolve();
  }
  modifyBinary() {
    return Promise.resolve();
  }
  append() {
    return Promise.resolve();
  }
  process() {
    return Promise.resolve('');
  }
  copy() {
    return Promise.resolve(new TFile({ path: 'copy.md' }));
  }
  getAllLoadedFiles() {
    return [];
  }
  getAllFolders() {
    return [];
  }
  getMarkdownFiles() {
    return [];
  }
  getFiles() {
    return [];
  }
  static recurseChildren() {}
}

/** Minimal Workspace stub */
export class Workspace {
  activeLeaf: WorkspaceLeaf | null = null;
  leftSplit: any = {};
  rightSplit: any = {};
  leftRibbon: any = {};
  rightRibbon: any = {};
  rootSplit: any = {};
  containerEl: any = {};
  layoutReady = true;
  activeEditor = null;
  on() {
    return { unsubscribe: () => {} };
  }
  onLayoutReady(cb: () => void) {
    cb();
  }
  getLeaf() {
    return new WorkspaceLeaf();
  }
  getActiveViewOfType() {
    return null;
  }
  getActiveFile() {
    return null;
  }
  revealLeaf() {
    return Promise.resolve();
  }
  getLeavesOfType() {
    return [];
  }
  detachLeavesOfType() {}
  getRightLeaf() {
    return new WorkspaceLeaf();
  }
}

/** Minimal Component base class stub */
export class Component {
  load() {}
  onload() {}
  unload() {}
  onunload() {}
  addChild(_child: any) {}
  removeChild(_child: any) {}
  register(_cb: any) {}
  registerEvent(_eventRef: any) {}
  registerDomEvent(_el: any, _type: string, _cb: any) {}
  registerInterval(_id: number) {
    return _id;
  }
}

/** Minimal Plugin base class stub */
export class Plugin extends Component {
  app: any;
  manifest: any = {};
  constructor(app: any, manifest: any) {
    super();
    // Ensure app and its nested properties are initialized if not provided
    this.app = app || {
      vault: new Vault(), // Use existing Vault mock
      workspace: new Workspace(), // Use existing Workspace mock
      metadataCache: new MetadataCache(), // Use existing MetadataCache mock
      // Add other app properties if needed by tests
    };
    // Ensure nested properties exist even if app is provided partially
    this.app.vault = this.app.vault || new Vault();
    this.app.workspace = this.app.workspace || new Workspace();
    this.app.metadataCache = this.app.metadataCache || new MetadataCache();

    this.manifest = manifest || { id: 'mock-plugin', name: 'Mock Plugin', version: '1.0.0' };
  }
  addCommand() {}
  registerView() {}
  addSettingTab() {}
  loadData() {
    return Promise.resolve({});
  }
  saveData() {
    return Promise.resolve();
  }
  addRibbonIcon() {
    return document.createElement('div');
  } // Add missing methods
  addStatusBarItem() {
    return document.createElement('div');
  }
  registerEditorExtension(_extension: any) {
    // Minimal stub - can be enhanced if needed
  }
}

/** Minimal PluginSettingTab base class stub */
export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any;
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }
  display() {}
  hide() {}
}

// --- Add Minimal Modal Stub ---
export class Modal {
  app: any;
  contentEl: HTMLElement;
  modalEl: HTMLElement;
  scope: any = { register: () => {} }; // Basic scope stub
  titleEl: HTMLElement;
  constructor(app: any) {
    this.app = app;
    // Enhance mock elements with common methods used
    const createMockElement = (tag: string): HTMLElement => {
      const el = document.createElement(tag) as any;
      el.addClass = vi.fn();
      el.removeClass = vi.fn();
      el.toggleClass = vi.fn();
      el.setText = vi.fn();
      el.setAttr = vi.fn();
      el.createEl = vi.fn((childTag: string, options?: any) => createMockElement(childTag));
      el.createDiv = vi.fn((options?: any) => createMockElement('div'));
      el.empty = vi.fn();
      el.appendChild = vi.fn((child: Node) => {
        /* no-op */
      });
      el.remove = vi.fn();
      // Add other methods if needed by tests
      return el;
    };

    this.modalEl = createMockElement('div');
    this.modalEl.addClass('modal'); // Call the mocked addClass
    this.contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
    this.titleEl = this.modalEl.createEl('h2', { cls: 'modal-title' });
  }
  onOpen() {}
  onClose() {}
  open() {
    // Simulate adding to body or specific container for testing if needed
    document.body.appendChild(this.modalEl);
    this.onOpen();
  }
  close() {
    this.modalEl.remove();
    this.onClose();
  }
  setTitle(title: string): this {
    this.titleEl.setText(title);
    return this;
  }
  // Add other methods/properties if needed by tests
}
// --- End Minimal Modal Stub ---

// --- Add Minimal Setting Stub ---
export class Setting {
  settingEl: any; // Use any to simplify mocking methods directly
  nameEl: any;
  descEl: any;
  controlEl: any;

  constructor(containerEl: HTMLElement) {
    this.settingEl = document.createElement('div');
    this.settingEl.addClass = vi.fn();
    this.settingEl.removeClass = vi.fn();
    this.settingEl.toggleClass = vi.fn();
    this.settingEl.createEl = vi.fn((tag, opts) => {
      const el = document.createElement(tag);
      if (opts?.text) el.textContent = opts.text;
      if (opts?.cls) el.className = opts.cls; // Basic class handling
      // Add more mock element methods if needed
      el.addClass = vi.fn();
      el.removeClass = vi.fn();
      return el;
    });
    this.settingEl.appendChild = vi.fn(); // Mock appendChild

    this.settingEl.addClass('setting-item');

    // Create standard child elements often expected
    const nameAndDescContainer = this.settingEl.createEl('div', { cls: 'setting-item-info' });
    this.nameEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-name' });
    this.descEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-description' });
    this.controlEl = this.settingEl.createEl('div', { cls: 'setting-item-control' });

    // Simulate adding to container
    if (containerEl && typeof containerEl.appendChild === 'function') {
      containerEl.appendChild(this.settingEl);
    } else {
      console.warn('Setting mock: containerEl provided without appendChild method');
    }
  }

  setName(name: string): this {
    this.nameEl.textContent = name;
    return this;
  }

  setDesc(desc: string | DocumentFragment): this {
    this.descEl.textContent = typeof desc === 'string' ? desc : '';
    return this;
  }

  setClass(cls: string): this {
    this.settingEl.addClass(cls); // Assumes addClass is mocked on settingEl
    return this;
  }

  // Add stubs for common control methods, returning `this` for chaining
  addText(cb: (text: any) => any): this {
    const mockInput = {
      inputEl: document.createElement('input'),
      setPlaceholder: vi.fn().mockReturnThis(),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
      then: vi.fn().mockReturnThis(), // Allow chaining if needed
    };
    this.controlEl.appendChild(mockInput.inputEl);
    cb(mockInput);
    return this;
  }
  addSearch(cb: (search: any) => any): this {
    const mockSearch = {
      inputEl: document.createElement('input'),
      setPlaceholder: vi.fn().mockReturnThis(),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
      then: vi.fn().mockReturnThis(),
    };
    this.controlEl.appendChild(mockSearch.inputEl);
    cb(mockSearch);
    return this;
  }
  addToggle(cb: (toggle: any) => any): this {
    const mockToggle = {
      toggleEl: document.createElement('div'),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
      then: vi.fn().mockReturnThis(),
    };
    this.controlEl.appendChild(mockToggle.toggleEl);
    cb(mockToggle);
    return this;
  }
  addButton(cb: (button: any) => any): this {
    const mockButton = {
      buttonEl: document.createElement('button'),
      setButtonText: vi.fn().mockReturnThis(),
      setCta: vi.fn().mockReturnThis(),
      onClick: vi.fn().mockReturnThis(),
      then: vi.fn().mockReturnThis(),
    };
    this.controlEl.appendChild(mockButton.buttonEl);
    cb(mockButton);
    return this;
  }

  addDropdown(cb: (dropdown: any) => any): this {
    const mockDropdown = {
      selectEl: document.createElement('select'),
      addOption: vi.fn().mockReturnThis(),
      addOptions: vi.fn().mockReturnThis(), // Add if needed
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
      then: vi.fn().mockReturnThis(),
    };
    this.controlEl.appendChild(mockDropdown.selectEl);
    cb(mockDropdown);
    return this;
  }

  // Add other control methods if needed by tests
}
// --- End Minimal Setting Stub ---

// Add other exports if needed by tests, e.g., utility functions
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

// Export commonly used types/interfaces if needed, though they are often just type hints
// export type TAbstractFile = TFile | TFolder;
