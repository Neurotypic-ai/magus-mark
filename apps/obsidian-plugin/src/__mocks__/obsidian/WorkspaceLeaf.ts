import { WorkspaceTabs } from 'obsidian';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { ItemView } from './ItemView';
import { Events } from './MockEvents';
import { Vault } from './Vault';

import type {
  Vault as VaultType,
  View,
  WorkspaceContainer as WorkspaceContainerType,
  WorkspaceLeaf as WorkspaceLeafType,
  WorkspaceMobileDrawer,
  WorkspaceParent,
  WorkspaceRoot,
} from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

/** Minimal WorkspaceLeaf stub */

export class WorkspaceLeaf extends Events implements WorkspaceLeafType {
  id = `leaf-${String(Math.random())}`;
  view: View;
  parent: WorkspaceTabs | WorkspaceMobileDrawer = new WorkspaceTabs();
  app: { vault: VaultType } = { vault: new Vault() }; // Basic app stub
  containerEl: MockObsidianElement<'div'> = createMockObsidianElement<'div'>('div'); // Use helper

  // Minimal mock for WorkspaceContainer
  private _mockContainer: WorkspaceContainerType;

  constructor() {
    super();
    this.view = new ItemView(this);
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
