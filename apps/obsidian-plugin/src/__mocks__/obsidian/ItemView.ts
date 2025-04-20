import { Events } from './MockEvents';
import { createMockObsidianElement } from './MockObsidianElement';

import type { App } from '../obsidian';
import type { MockObsidianElement } from './MockObsidianElement';
import type { WorkspaceLeaf } from './WorkspaceLeaf';

/** Minimal ItemView stub */

export class ItemView extends Events {
  app: App;
  icon = '';
  navigation = false;
  leaf: WorkspaceLeaf;
  containerEl: MockObsidianElement<'div'>;
  scope: unknown = null;

  constructor(leaf: WorkspaceLeaf) {
    super();
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
  setState(state: Record<string, unknown>, result: unknown): Promise<void> {
    console.log('setState', state, result);
    return Promise.resolve();
  }
  getEphemeralState(): Record<string, unknown> {
    console.log('getEphemeralState');
    return {};
  }
  setEphemeralState(state: Record<string, unknown>): Promise<void> {
    console.log('setEphemeralState', state);
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
  registerDomEvent(el: HTMLElement, type: string, cb: () => void): void {
    console.log('registerDomEvent', el, type, cb);
    /* no-op for mock */
  }
  addAction(icon: string, title: string, cb: () => void): MockObsidianElement {
    console.log('addAction', icon, title, cb);
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
