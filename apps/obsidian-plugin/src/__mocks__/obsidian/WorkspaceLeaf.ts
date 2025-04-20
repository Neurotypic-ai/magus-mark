import { Workspace, WorkspaceTabs } from 'obsidian';

import { ItemView } from './ItemView';
import { Events } from './MockEvents';
import { createMockObsidianElement } from './MockObsidianElement';
import { Vault } from './Vault';

import type { Vault as VaultType, View, WorkspaceLeaf as WorkspaceLeafType, WorkspaceMobileDrawer } from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

/** Minimal WorkspaceLeaf stub */

export class WorkspaceLeaf extends Events implements WorkspaceLeafType {
  id = `leaf-${String(Math.random())}`;
  view: View;
  parent: WorkspaceTabs | WorkspaceMobileDrawer = new WorkspaceTabs();
  app: { vault: VaultType } = { vault: new Vault() }; // Basic app stub
  containerEl: MockObsidianElement<'div'> = createMockObsidianElement<'div'>('div'); // Use helper
  constructor() {
    super();
    this.view = new ItemView(new Workspace());
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
