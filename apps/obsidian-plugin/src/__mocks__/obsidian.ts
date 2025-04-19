import { TFile } from 'obsidian';
import { vi } from 'vitest';

import type { PluginManifest } from 'obsidian';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

interface ElementAttrs {
  cls?: string | string[] | undefined;
  text?: string | DocumentFragment | undefined;
  textContent?: string | null;
  type?: string | undefined;
}

// Define Obsidian-specific helpers separately from HTMLElement
interface ObsidianElementExtras {
  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: ElementAttrs
  ): HTMLElementTagNameMap[K] & ObsidianElementExtras;
  createDiv(attrs?: ElementAttrs): HTMLDivElement & ObsidianElementExtras;
  setText(text: string): void;
  empty(): void;
  addClass(cls: string): void;
  removeClass(cls: string): void;
  setAttr(attr: string, value: string): void;
  doc: Document;
}

// Generic mock element type: specific HTMLElement plus Obsidian helpers
export type MockObsidianElement<K extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap> =
  HTMLElementTagNameMap[K] & ObsidianElementExtras;

// Create a mock element of the given tag, augmented with Obsidian helpers
export function createMockObsidianElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: ElementAttrs
): MockObsidianElement<K> {
  const el = document.createElement(tag) as MockObsidianElement<K>;
  if (attrs) {
    if (attrs.cls) el.className = Array.isArray(attrs.cls) ? attrs.cls.join(' ') : attrs.cls;
    if (attrs.text) el.textContent = typeof attrs.text === 'string' ? attrs.text : (attrs.text.textContent ?? '');
    if (attrs.textContent) el.textContent = attrs.textContent;
  }
  // Attach Obsidian-specific helpers
  el.createEl = vi.fn(
    <L extends keyof HTMLElementTagNameMap>(childTag: L, childAttrs?: ElementAttrs): MockObsidianElement<L> => {
      const childEl = createMockObsidianElement<L>(childTag, childAttrs);
      el.appendChild(childEl);
      return childEl;
    }
  );
  el.createDiv = vi.fn((divAttrs?: ElementAttrs): MockObsidianElement<'div'> => {
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
  el.doc = document; // Add doc property

  return el;
}

/** Minimal TFolder stub */
export class TFolder {
  path = '';
  name = '';
  children: (TFile | TFolder)[] = [];
  parent: TFolder | null = null;
  vault: Vault;
  constructor(path: string) {
    this.path = path;
    this.name = path.split('/').pop() ?? '';
    this.children = [];
    this.vault = new Vault();
  }
  isRoot(): boolean {
    return this.path === '/';
  }
}

/** Minimal Platform stub */
export const Platform = { isDesktopApp: true, isMobile: false }; // Default to desktop

/** Minimal WorkspaceLeaf stub */
export class WorkspaceLeaf {
  id = `leaf-${String(Math.random())}`;
  view: ItemView | null = null;
  parent: Workspace | null = null;
  app: { vault: Vault } = { vault: new Vault() }; // Basic app stub
  containerEl: MockObsidianElement<'div'> = createMockObsidianElement<'div'>('div'); // Use helper
  constructor() {
    this.containerEl.appendChild(createMockObsidianElement<'div'>('div'));
    this.containerEl.appendChild(createMockObsidianElement<'div'>('div'));
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
  togglePinned(): void {
    /* no-op for mock */
  }
  setPinned(): void {
    /* no-op for mock */
  }
  setGroupMember(): void {
    /* no-op for mock */
  }
  setGroup(): void {
    /* no-op for mock */
  }
  detach(): void {
    /* no-op for mock */
  }
  getIcon(): string {
    return 'document';
  }
  getDisplayText(): string {
    return 'Mock Leaf';
  }
  onResize(): void {
    /* no-op for mock */
  }
  isDeferred = false;
  loadIfDeferred(): Promise<void> {
    return Promise.resolve();
  }
}

/** Minimal ItemView stub */
export class ItemView {
  app: App;
  icon = '';
  navigation = false;
  leaf: WorkspaceLeaf;
  containerEl: MockObsidianElement<'div'>;
  scope: unknown = null;
  constructor(leaf: WorkspaceLeaf) {
    this.leaf = leaf;
    this.containerEl = createMockObsidianElement<'div'>('div'); // Use helper
    this.app = leaf.app as unknown as App;
  }
  getViewType(): string {
    return 'mock-item-view';
  }
  getState(): Record<string, unknown> {
    return {};
  }
  setState(_state: Record<string, unknown>, _result: unknown): Promise<void> {
    return Promise.resolve();
  }
  getEphemeralState(): Record<string, unknown> {
    return {};
  }
  setEphemeralState(_state: Record<string, unknown>): Promise<void> {
    return Promise.resolve();
  }
  getIcon(): string {
    return this.icon;
  }
  onResize(): void {
    /* no-op for mock */
  }
  getDisplayText(): string {
    return 'Mock Item View';
  }
  onPaneMenu(): void {
    /* no-op for mock */
  }
  onOpen(): Promise<void> {
    return Promise.resolve();
  }
  onClose(): Promise<void> {
    return Promise.resolve();
  }
  registerDomEvent(_el: HTMLElement, _type: string, _cb: () => void): void {
    /* no-op for mock */
  }
  addAction(_icon: string, _title: string, _cb: () => void): MockObsidianElement {
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
  adapter: Record<string, unknown> = {};
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
    if (!path.includes('.') || /\.\w+$/.exec(path) === null || !['md'].includes(path.split('.').pop() ?? '')) {
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
  }
}

/** Minimal Workspace stub */
export class Workspace {
  activeLeaf: WorkspaceLeaf | null = null;
  leftSplit: Record<string, unknown> = {};
  rightSplit: Record<string, unknown> = {};
  leftRibbon: Record<string, unknown> = {};
  rightRibbon: Record<string, unknown> = {};
  rootSplit: Record<string, unknown> = {};
  containerEl: MockObsidianElement = createMockObsidianElement('div');
  layoutReady = true;
  activeEditor: unknown = null;
  on(): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  }
  onLayoutReady(cb: () => void): void {
    cb();
  }
  getLeaf(): WorkspaceLeaf {
    return new WorkspaceLeaf();
  }
  getActiveViewOfType(): ItemView | null {
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
  addChild(_child: Component): void {
    /* no-op for mock */
  }
  registerEvent(_eventRef: unknown): void {
    /* no-op for mock */
  }
  registerDomEvent(_el: HTMLElement, _type: string, _cb: () => void): void {
    /* no-op for mock */
  }
  registerInterval(_id: number): number {
    return _id;
  }
}

/** Minimal Plugin base class stub */
export class Plugin extends Component {
  app: App;
  manifest: PluginManifest;
  constructor(app: App, manifest: PluginManifest) {
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

/** Minimal PluginSettingTab base class stub */
export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: MockObsidianElement<'div'>;
  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = createMockObsidianElement<'div'>('div'); // Use helper
  }
  display(): void {
    /* no-op for mock */
  }
  hide(): void {
    /* no-op for mock */
  }
}

// --- Add Minimal Modal Stub --- (From FolderTagModal.test.ts)
export class Modal {
  app: App;
  modalEl: MockObsidianElement<'div'>;
  contentEl: MockObsidianElement<'div'>;
  titleEl: MockObsidianElement<'h2'>;
  scope: { register: () => void } = { register: () => {} }; // Basic scope stub
  constructor(app: App) {
    this.app = app;
    this.modalEl = createMockObsidianElement<'div'>('div');
    this.modalEl.addClass('modal');
    this.contentEl = this.modalEl.createDiv({ cls: 'modal-content' });
    this.titleEl = this.modalEl.createEl<'h2'>('h2', { cls: 'modal-title' });
  }
  onOpen(): Promise<void> {
    return Promise.resolve();
  }
  onClose(): Promise<void> {
    return Promise.resolve();
  }
  open(): Promise<void> {
    document.body.appendChild(this.modalEl);
    void this.onOpen();
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.modalEl.remove();
    void this.onClose();
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
  settingEl: MockObsidianElement<'div'>;
  nameEl: MockObsidianElement<'div'>;
  descEl: MockObsidianElement<'div'>;
  controlEl: MockObsidianElement<'div'>;

  constructor(containerEl: MockObsidianElement) {
    // All children created via .createEl are MockObsidianElement by contract
    this.settingEl = createMockObsidianElement<'div'>('div', { cls: 'setting-item' });
    const nameAndDescContainer = this.settingEl.createEl('div', { cls: 'setting-item-info' });
    const nameEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-name' });
    const descEl = nameAndDescContainer.createEl('div', { cls: 'setting-item-description' });
    const controlEl = this.settingEl.createEl('div', { cls: 'setting-item-control' });
    this.nameEl = nameEl;
    this.descEl = descEl;
    this.controlEl = controlEl;
    containerEl.appendChild(this.settingEl);
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
  addText(
    cb: (text: {
      inputEl: MockObsidianElement;
      setPlaceholder: () => void;
      setValue: () => void;
      onChange: () => void;
    }) => void
  ): this {
    const el = createMockObsidianElement<'input'>('input', { type: 'text' });
    this.controlEl.appendChild(el);
    cb({
      inputEl: el,
      setPlaceholder: vi.fn(),
      setValue: vi.fn(),
      onChange: vi.fn(),
    });
    return this;
  }
  addSearch(
    cb: (search: {
      inputEl: MockObsidianElement;
      setPlaceholder: () => void;
      setValue: () => void;
      onChange: () => void;
    }) => void
  ): this {
    const el = createMockObsidianElement<'input'>('input', { type: 'search' });
    this.controlEl.appendChild(el);
    cb({
      inputEl: el,
      setPlaceholder: vi.fn(),
      setValue: vi.fn(),
      onChange: vi.fn(),
    });
    return this;
  }
  addToggle(cb: (toggle: { inputEl: MockObsidianElement; setValue: () => void; onChange: () => void }) => void): this {
    const el = createMockObsidianElement<'input'>('input', { type: 'checkbox' });
    this.controlEl.appendChild(el);
    cb({ inputEl: el, setValue: vi.fn(), onChange: vi.fn() });
    return this;
  }
  addButton(
    cb: (button: {
      buttonEl: MockObsidianElement;
      setButtonText: () => void;
      setCta: () => void;
      onClick: () => void;
    }) => void
  ): this {
    const el = createMockObsidianElement<'button'>('button');
    this.controlEl.appendChild(el);
    cb({
      buttonEl: el,
      setButtonText: vi.fn(),
      setCta: vi.fn(),
      onClick: vi.fn(),
    });
    return this;
  }
  addDropdown(
    cb: (dropdown: {
      selectEl: MockObsidianElement;
      addOption: () => void;
      addOptions: () => void;
      getValue: () => string;
      setValue: () => void;
      onChange: () => void;
    }) => void
  ): this {
    const el = createMockObsidianElement<'select'>('select');
    this.controlEl.appendChild(el);
    cb({
      selectEl: el,
      addOption: vi.fn(),
      addOptions: vi.fn(),
      getValue: vi.fn(),
      setValue: vi.fn(),
      onChange: vi.fn(),
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

// Minimal App stub for shared tests
export class App {
  vault: Vault;
  workspace: Workspace;
  metadataCache: MetadataCache;
  keymap: Record<string, unknown> = {};
  scope: Record<string, unknown> = {};
  fileManager: Record<string, unknown> = {};
  lastEvent: unknown = null;
  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
    this.metadataCache = new MetadataCache();
  }
}
