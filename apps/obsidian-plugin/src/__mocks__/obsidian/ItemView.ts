import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Component } from './Component';

import type {
  App,
  ItemView as ItemViewType,
  Menu,
  Scope,
  ViewStateResult,
  WorkspaceLeaf as WorkspaceLeafType,
} from 'obsidian';
import type { Mock } from 'vitest';

import type { MockObsidianElement } from './MockObsidianElement';

export class ItemView extends Component implements Partial<ItemViewType> {
  navigation = true;
  icon = 'mock-icon';
  leaf: WorkspaceLeafType;
  override containerEl: MockObsidianElement<'div'>;
  contentEl: MockObsidianElement<'div'>;
  // The mocked app field comes from the component
  app: App;
  // The mocked scope field comes from the component
  scope: Scope;

  constructor(leaf: WorkspaceLeafType) {
    super();
    this.leaf = leaf;
    this.containerEl = createMockObsidianElement('div');
    this.contentEl = createMockObsidianElement('div');
    // Type assertion for mock purposes - in real implementation leaf.app would be properly typed
    this.app = (leaf as WorkspaceLeafType & { app: App }).app;
    this.scope = this.app.scope;
  }

  getViewType(): string {
    return 'mock-item-view';
  }
  getDisplayText(): string {
    return 'Mock Item View';
  }
  getIcon(): string {
    return this.icon;
  }
  getState(): Record<string, unknown> {
    return {};
  }
  setState(_state: unknown, _result: ViewStateResult): Promise<void> {
    return Promise.resolve();
  }
  getEphemeralState(): Record<string, unknown> {
    return {};
  }
  setEphemeralState(_state: unknown): void {
    // Mock implementation
  }
  onHeaderMenu(_menu: Menu): void {
    // Mock implementation
  }
  onPaneMenu(_menu: Menu, _source: string): void {
    // Mock implementation - required by ItemView interface
  }
  onResize(): void {
    // Mock implementation
  }
  onOpen(): Promise<void> {
    return Promise.resolve();
  }
  onClose(): Promise<void> {
    return Promise.resolve();
  }
  override onunload: Mock<() => void> = vi.fn();

  // Override Component methods to make them mockable if needed
  override load: Mock<() => void> = vi.fn();
  override onload: Mock<() => void> = vi.fn();
  override register: Mock<(cb: () => unknown) => void> = vi.fn((cb) => cb());
  override registerEvent: Mock<(ref: unknown) => void> = vi.fn();

  addAction(_icon: string, title: string, callback: (evt: MouseEvent) => unknown): HTMLElement {
    const element = document.createElement('button');
    element.setAttribute('aria-label', title);
    element.onclick = callback;
    return element;
  }
}
