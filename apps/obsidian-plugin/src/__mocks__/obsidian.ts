import { vi } from 'vitest';

// This file provides minimal stubs for the 'obsidian' module
// allowing tests to run without needing the full Obsidian environment.

// --- Recursive Mock Element Helper (Needed by Setting/Modal mocks) ---
// Type definition for element attributes
interface ElementAttrs {
  cls?: string;
  text?: string;
  textContent?: string;
  type?: string;
  placeholder?: string;
  value?: string;
}

// Add MockObsidianElement interface for type safety in tests
export interface MockObsidianElement extends HTMLElement {
  createEl: ReturnType<typeof vi.fn>;
  createDiv: ReturnType<typeof vi.fn>;
  setText: ReturnType<typeof vi.fn>;
  empty: ReturnType<typeof vi.fn>;
  addClass: ReturnType<typeof vi.fn>;
  removeClass: ReturnType<typeof vi.fn>;
  toggleClass: ReturnType<typeof vi.fn>;
  setAttr: ReturnType<typeof vi.fn>;
  appendChild: ReturnType<typeof vi.fn>;
  removeChild: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  // ...add any other methods you mock
}

export const createMockObsidianElement = (tag: string, attrs?: ElementAttrs): MockObsidianElement => {
  const el = document.createElement(tag) as any; // Use 'any' for easier mocking
  if (attrs) {
    if (attrs.cls) el.className = attrs.cls;
    if (attrs.text) el.textContent = attrs.text;
    if (attrs.textContent) el.textContent = attrs.textContent;
    if (attrs.type) el.type = attrs.type;
    if (attrs.placeholder) el.placeholder = attrs.placeholder;
    if (attrs.value) el.value = attrs.value;
  }
  // Attach mocked Obsidian methods
  el.createEl = vi.fn((childTag: string, childAttrs?: ElementAttrs) => {
    const childEl = createMockObsidianElement(childTag, childAttrs);
    el.appendChild(childEl);
    return childEl;
  });
  el.createDiv = vi.fn((divAttrs?: ElementAttrs) => {
    const divEl = createMockObsidianElement('div', divAttrs);
    el.appendChild(divEl);
    return divEl;
  });
  el.setText = vi.fn((text: string) => {
    el.textContent = text;
  });
  el.empty = vi.fn(() => {
    el.innerHTML = '';
  });
  el.addClass = vi.fn();
  el.removeClass = vi.fn();
  el.toggleClass = vi.fn();
  el.setAttr = vi.fn();
  el.appendChild = vi.fn((child: Node) => {});
  el.removeChild = vi.fn();
  el.remove = vi.fn();
  if (!el.dataset) {
    el.dataset = {};
  }
  if (!el.style) {
    el.style = {};
  } // Ensure style exists
  el.doc = document; // Add doc property

  return el as MockObsidianElement;
};
// --- End Helper ---

/** Minimal Notice stub */
export const Notice = vi.fn().mockImplementation((message: string | DocumentFragment) => {
  console.log('NOTICE:', message);
  return {
    hide: vi.fn(),
    setMessage: vi.fn(),
  };
});

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
    this.children = [];
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
    this.basename = this.name.replace(/\.[^/.]+$/, ''); // More robust basename
    this.extension = this.name.includes('.') ? (this.name.split('.').pop() ?? '') : '';
    // Ensure parent is correctly typed if path indicates it
    if (this.path && this.path !== '/' && this.path.includes('/')) {
      const parentPath = this.path.substring(0, this.path.lastIndexOf('/'));
      this.parent = new TFolder(parentPath || '/');
    }
  }
}

/** Minimal Platform stub */
export const Platform = { isDesktopApp: true, isMobile: false }; // Default to desktop

/** Minimal WorkspaceLeaf stub */
export class WorkspaceLeaf {
  id = `leaf-${Math.random()}`;
  view: any = null;
  parent: any = null;
  app: any = { vault: new Vault() }; // Basic app stub
  containerEl: any = createMockObsidianElement('div'); // Use helper
  constructor() {
    this.containerEl.children = [createMockObsidianElement('div'), createMockObsidianElement('div')];
  }
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
    this.containerEl = createMockObsidianElement('div'); // Use helper
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
    return createMockObsidianElement('div');
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
    if (path.endsWith('.md')) {
      return new TFile({ path });
    }
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
    this.app = app || { vault: new Vault(), workspace: new Workspace(), metadataCache: new MetadataCache() };
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
    return createMockObsidianElement('div');
  }
  addStatusBarItem() {
    const el = createMockObsidianElement('div');
    el.setText = vi.fn(); // Add this
    el.addClass = vi.fn(); // And this, if not already present
    return el;
  }
  registerEditorExtension(_extension: any) {}
}

/** Minimal PluginSettingTab base class stub */
export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any;
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = createMockObsidianElement('div'); // Use helper
  }
  display() {}
  hide() {}
}

// --- Add Minimal Modal Stub --- (From FolderTagModal.test.ts)
export class Modal {
  app: any;
  contentEl: HTMLElement;
  modalEl: HTMLElement;
  scope: any = { register: () => {} }; // Basic scope stub
  titleEl: HTMLElement;
  constructor(app: any) {
    this.app = app;
    this.modalEl = createMockObsidianElement('div');
    this.modalEl.addClass('modal');
    this.contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
    this.titleEl = this.modalEl.createEl('h2', { cls: 'modal-title' });
  }
  onOpen() {}
  onClose() {}
  open() {
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
}
// --- End Minimal Modal Stub ---

// --- Add Minimal Setting Stub --- (From FolderTagModal.test.ts)
export class Setting {
  settingEl: any;
  nameEl: any;
  descEl: any;
  controlEl: any;

  constructor(containerEl: HTMLElement) {
    this.settingEl = createMockObsidianElement('div', { cls: 'setting-item' });
    const nameAndDescContainer = this.settingEl.createEl('div', { cls: 'setting-item-info' });
    this.nameEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-name' });
    this.descEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-description' });
    this.controlEl = this.settingEl.createEl('div', { cls: 'setting-item-control' });
    containerEl?.appendChild(this.settingEl); // Add null check for safety
  }

  setName(name: string): this {
    this.nameEl.setText(name);
    return this;
  }
  setDesc(desc: string | DocumentFragment): this {
    this.descEl.setText(typeof desc === 'string' ? desc : (desc.textContent ?? ''));
    return this;
  }
  setClass(cls: string): this {
    this.settingEl.addClass(cls);
    return this;
  }
  addText(cb: (text: any) => any): this {
    const el = createMockObsidianElement('input', { type: 'text' });
    this.controlEl.appendChild(el);
    cb({
      inputEl: el,
      setPlaceholder: vi.fn().mockReturnThis(),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
    });
    return this;
  }
  addSearch(cb: (search: any) => any): this {
    const el = createMockObsidianElement('input', { type: 'search' });
    this.controlEl.appendChild(el);
    cb({
      inputEl: el,
      setPlaceholder: vi.fn().mockReturnThis(),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
    });
    return this;
  }
  addToggle(cb: (toggle: any) => any): this {
    const el = createMockObsidianElement('input', { type: 'checkbox' });
    this.controlEl.appendChild(el);
    cb({ inputEl: el, setValue: vi.fn().mockReturnThis(), onChange: vi.fn().mockReturnThis() });
    return this;
  }
  addButton(cb: (button: any) => any): this {
    const el = createMockObsidianElement('button');
    this.controlEl.appendChild(el);
    cb({
      buttonEl: el,
      setButtonText: vi.fn().mockReturnThis(),
      setCta: vi.fn().mockReturnThis(),
      onClick: vi.fn().mockReturnThis(),
    });
    return this;
  }
  addDropdown(cb: (dropdown: any) => any): this {
    const el = createMockObsidianElement('select');
    this.controlEl.appendChild(el);
    cb({
      selectEl: el,
      addOption: vi.fn().mockReturnThis(),
      addOptions: vi.fn().mockReturnThis(),
      getValue: vi.fn(),
      setValue: vi.fn().mockReturnThis(),
      onChange: vi.fn().mockReturnThis(),
    });
    return this;
  }
}
// --- End Minimal Setting Stub ---

// Add other exports if needed by tests, e.g., utility functions
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

// Export commonly used types/interfaces if needed, though they are often just type hints
// export type TAbstractFile = TFile | TFolder;
