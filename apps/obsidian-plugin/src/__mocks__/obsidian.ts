import { TFile } from 'obsidian';
import { vi } from 'vitest';

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
  /** Value for input elements */
  value?: string;
  /** Checked state for checkbox elements */
  checked?: boolean;
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
  el.appendChild = vi.fn((child: Node) => {
    el.appendChild(child);
  });
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
  isRoot(): boolean {
    return this.path === '/';
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
  setViewState(): Promise<void> {
    return Promise.resolve();
  }
  getEphemeralState(): Record<string, unknown> {
    return {};
  }
  setEphemeralState(): Promise<void> {
    return Promise.resolve();
  }
  openFile(): Promise<void> {
    return Promise.resolve();
  }
  open(): Promise<void> {
    return Promise.resolve();
  }
  getViewState(): { type: string; state: Record<string, unknown> } {
    return { type: '', state: {} };
  }
  togglePinned(): void {}
  setPinned(): void {}
  setGroupMember(): void {}
  setGroup(): void {}
  detach(): void {}
  getIcon(): string {
    return 'document';
  }
  getDisplayText(): string {
    return 'Mock Leaf';
  }
  onResize(): void {}
  isDeferred = false;
  loadIfDeferred(): Promise<void> {
    return Promise.resolve();
  }
}

/** Minimal ItemView stub */
export class ItemView {
  app: any;
  icon = '';
  navigation = false;
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
  getState(): Record<string, unknown> {
    return {};
  }
  setState(_state: any, _result: any): Promise<void> {
    return Promise.resolve();
  }
  getEphemeralState(): Record<string, unknown> {
    return {};
  }
  setEphemeralState(_state: any): Promise<void> {
    return Promise.resolve();
  }
  getIcon(): string {
    return this.icon;
  }
  onResize(): void {}
  getDisplayText(): string {
    return 'Mock Item View';
  }
  onPaneMenu(): void {}
  onOpen(): Promise<void> {
    return Promise.resolve();
  }
  onClose(): Promise<void> {
    return Promise.resolve();
  }
  registerDomEvent(_el: any, _type: string, _cb: any): void {}
  addAction(_icon: string, _title: string, _cb: any): HTMLElement {
    return createMockObsidianElement('div');
  }
  load(): Promise<void> {
    return Promise.resolve();
  }
  onload(): Promise<void> {
    return Promise.resolve();
  }
  unload(): Promise<void> {
    return Promise.resolve();
  }
  onunload(): Promise<void> {
    return Promise.resolve();
  }
}

/** Minimal MetadataCache stub */
export class MetadataCache {
  on(): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  }
  getFileCache(): null {
    return null;
  }
  getCache(): null {
    return null;
  }
  fileToLinktext(file: TFile): string {
    return file.name;
  }
  getFirstLinkpathDest(path: string): string | null {
    return path.split('.').pop() ?? null;
  }
  resolvedLinks: Record<string, string> = {};
  unresolvedLinks: Record<string, string> = {};
}

/** Minimal Vault stub */
export class Vault {
  configDir = '.obsidian';
  adapter = {};
  on(): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  }
  getName(): string {
    return 'MockVault';
  }
  getFileByPath(): TFile | null {
    return null;
  }
  getFolderByPath(): TFolder | null {
    return null;
  }
  getAbstractFileByPath(path: string): TFile | TFolder | null {
    if (path.endsWith('.md')) {
      return new TFile();
    }
    if (!path.includes('.') || (/\.\w+$/.exec(path)) === null || !['md'].includes(path.split('.').pop() ?? '')) {
      return new TFolder(path);
    }
    return null;
  }
  getRoot(): TFolder {
    return new TFolder('/');
  }
  create(): Promise<TFile> {
    return Promise.resolve(new TFile());
  }
  createBinary(): Promise<TFile> {
    return Promise.resolve(new TFile());
  }
  createFolder(): Promise<TFolder> {
    return Promise.resolve(new TFolder('new_folder'));
  }
  read(): Promise<string> {
    return Promise.resolve('');
  }
  cachedRead(): Promise<string> {
    return Promise.resolve('');
  }
  readBinary(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
  getResourcePath(): string {
    return '';
  }
  delete(): Promise<void> {
    return Promise.resolve();
  }
  trash(): Promise<void> {
    return Promise.resolve();
  }
  rename(): Promise<void> {
    return Promise.resolve();
  }
  modify(): Promise<void> {
    return Promise.resolve();
  }
  modifyBinary(): Promise<void> {
    return Promise.resolve();
  }
  append(): Promise<void> {
    return Promise.resolve();
  }
  process(): Promise<string> {
    return Promise.resolve('');
  }
  copy(): Promise<TFile> {
    return Promise.resolve(new TFile());
  }
  getAllLoadedFiles(): TFile[] {
    return [];
  }
  getAllFolders(): TFolder[] {
    return [];
  }
  getMarkdownFiles(): TFile[] {
    return [];
  }
  getFiles(): TFile[] {
    return [];
  }
  static recurseChildren(folder: TFolder, callback: (file: TFile | TFolder) => void): void {
    callback(folder);
    // No-op implementation
  }
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
  on(): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  }
  onLayoutReady(cb: () => void): void {
    cb();
  }
  getLeaf(): WorkspaceLeaf {
    return new WorkspaceLeaf();
  }
  getActiveViewOfType(): any {
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
    // No-op implementation
  }
  getRightLeaf(): WorkspaceLeaf {
    return new WorkspaceLeaf();
  }
}

/** Minimal Component base class stub */
export class Component {
  load(): Promise<void> {
    return Promise.resolve();
  }
  onload(): Promise<void> {
    return Promise.resolve();
  }
  unload(): Promise<void> {
    return Promise.resolve();
  }
  onunload(): Promise<void> {
    return Promise.resolve();
  }
  addChild(_child: any): void {
    // No-op implementation
  }
  registerEvent(_eventRef: any): void {
    // No-op implementation
  }
  registerDomEvent(_el: any, _type: string, _cb: any): void {
    // No-op implementation
  }
  registerInterval(_id: number): number {
    return _id;
  }
}

/** Minimal Plugin base class stub */
export class Plugin extends Component {
  app: any;
  manifest: any = {};
  constructor(app: any, manifest: any) {
    super();
    this.app = app || { vault: new Vault(), workspacse: new Workspace(), metadataCache: new MetadataCache() };
    this.app.vault = this.app.vault || new Vault();
    this.app.workspace = this.app.workspace || new Workspace();
    this.app.metadataCache = this.app.metadataCache || new MetadataCache();
    this.manifest = manifest || { id: 'mock-plugin', name: 'Mock Plugin', version: '1.0.0' };
  }
  addCommand(): void {
    // No-op implementation
  }
  registerView(): void {
    // No-op implementation
  }
  addSettingTab(): void {
    // No-op implementation
  }
  loadData(): Promise<Record<string, unknown>> {
    return Promise.resolve({});
  }
  saveData(): Promise<void> {
    return Promise.resolve();
  }
  addRibbonIcon(): HTMLElement {
    return createMockObsidianElement('div');
  }
  addStatusBarItem(): HTMLElement {
    const el = createMockObsidianElement('div');
    el.setText = vi.fn(); // Add this
    el.addClass = vi.fn(); // And this, if not already present
    return el;
  }
  registerEditorExtension(_extension: any): void {
    // No-op implementation
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
    this.containerEl = createMockObsidianElement('div'); // Use helper
  }
  display(): void {
    // No-op implementation
  }
  hide(): void {
    // No-op implementation
  }
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
  onOpen(): Promise<void> {
    return Promise.resolve();
  }
  onClose(): Promise<void> {
    return Promise.resolve();
  }
  open(): Promise<void> {
    document.body.appendChild(this.modalEl);
    this.onOpen();
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.modalEl.remove();
    this.onClose();
    return Promise.resolve();
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
    containerEl.appendChild(this.settingEl); // Add null check for safety
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
