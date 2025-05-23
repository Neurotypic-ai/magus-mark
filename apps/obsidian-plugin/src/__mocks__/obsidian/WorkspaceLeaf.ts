import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Events } from './MockEvents';
import { Vault } from './Vault';

import type {
  Vault as VaultType,
  View,
  WorkspaceContainer,
  WorkspaceContainer as WorkspaceContainerType,
  WorkspaceLeaf as WorkspaceLeafType,
  WorkspaceMobileDrawer,
  WorkspaceParent,
  WorkspaceRoot,
  WorkspaceTabs,
} from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

// Enhanced mock for WorkspaceTabs with all required properties
class MockWorkspaceTabs extends Events implements WorkspaceTabs {
  parent: WorkspaceParent;
  doc: Document = document;
  win: Window = window;

  constructor() {
    super();
    // Create a minimal WorkspaceParent mock
    this.parent = {
      ...new Events(),
      doc: document,
      win: window,
      parent: null as any, // Will be set if needed
      getRoot: () => this.getRoot(),
      getContainer: () => this as any,
    } as WorkspaceParent;
  }

  getRoot(): WorkspaceRoot {
    // Return a self-referential mock
    return {
      ...new Events(),
      doc: this.doc,
      win: this.win,
      parent: null as any,
      getRoot: () => this.getRoot(),
      getContainer: () => this as any,
    } as WorkspaceRoot;
  }

  getContainer(): WorkspaceContainer {
    return this as any;
  }
}

// Simple View mock that extends Events - using type assertion to avoid protected method conflicts
class MockView extends Events {
  app: any;
  icon: string = 'document';
  navigation: boolean = false;
  leaf: WorkspaceLeafType;
  containerEl: HTMLElement;
  scope: any = { register: () => {}, unregister: () => {} };

  constructor(leaf: WorkspaceLeafType) {
    super();
    this.leaf = leaf;
    this.app = (leaf as any).app;
    this.containerEl = createMockObsidianElement('div');
  }

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
  setState(): Promise<void> {
    return Promise.resolve();
  }
  onResize(): void {}
  onHeaderMenu(): void {}
  onPaneMenu(): void {} // Add missing method
  async onOpen(): Promise<void> {}
  async onClose(): Promise<void> {}
  getEphemeralState(): any {
    return {};
  }
  setEphemeralState(): void {}

  // Component methods
  load(): void {}
  onload(): void {}
  unload(): void {}
  onunload(): void {}
  addChild<T extends any>(component: T): T {
    return component;
  }
  removeChild<T extends any>(component: T): T {
    return component;
  }
  register(cb: () => any): void {
    cb();
  }
  registerEvent(): void {}
  registerDomEvent(): void {}
  registerInterval(id: number): number {
    return id || window.setInterval(() => {}, 1000);
  }
}

/** Minimal WorkspaceLeaf stub */
export class WorkspaceLeaf extends Events implements WorkspaceLeafType {
  id = `leaf-${String(Math.random())}`;
  view: View;
  parent: MockWorkspaceTabs | WorkspaceMobileDrawer = new MockWorkspaceTabs();
  app: { vault: VaultType } = { vault: new Vault() }; // Basic app stub
  containerEl: MockObsidianElement<'div'> = createMockObsidianElement<'div'>('div'); // Use helper

  // Minimal mock for WorkspaceContainer
  private _mockContainer: WorkspaceContainerType;

  constructor() {
    super();
    this.view = new MockView(this) as unknown as View;
    this.containerEl.appendChild(createMockObsidianElement<'div'>('div'));
    this.containerEl.appendChild(createMockObsidianElement<'div'>('div'));

    // Initialize mock container
    this._mockContainer = {
      ...new Events(), // Spread event methods
      parent: {} as WorkspaceParent, // Mock parent
      getRoot: () => this.getRoot(),
      getContainer: () => this._mockContainer, // Return itself
      doc: document, // WorkspaceItem property
      win: window, // WorkspaceItem property
      // Add other WorkspaceItem/WorkspaceContainer properties if needed
    } as WorkspaceContainerType;
  }
  setViewState(): Promise<void> {
    return Promise.resolve();
  }
  getRoot(): WorkspaceRoot {
    // Create a self-referential mock for WorkspaceRoot
    const selfReferentialRoot: Partial<WorkspaceRoot> = {
      ...new Events(), // Spread event methods
      win: window as any,
      doc: document as any,
      parent: {} as any, // Mock WorkspaceParent
      getContainer: () => this._mockContainer,
      // Add other required WorkspaceRoot or WorkspaceItem properties here if they cause errors
    };
    // Now, assign getRoot to return the fully formed object.
    selfReferentialRoot.getRoot = () => selfReferentialRoot as WorkspaceRoot;

    return selfReferentialRoot as WorkspaceRoot;
  }
  getContainer(): WorkspaceContainerType {
    return this._mockContainer;
  }
  getEphemeralState(): Record<string, unknown> {
    return {};
  }
  setEphemeralState(): void {
    /* no-op for mock */
  }
  openFile(): Promise<void> {
    return Promise.resolve();
  }
  open(): Promise<View> {
    return Promise.resolve(this.view);
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
