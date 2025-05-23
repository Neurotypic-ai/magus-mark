import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Component } from './Component';

import type { ItemView as ItemViewType, WorkspaceLeaf as WorkspaceLeafType } from 'obsidian';
import type { Mock } from 'vitest';

import type { MockObsidianElement } from './MockObsidianElement';

export class ItemView extends Component implements ItemViewType {
  navigation = true;
  icon = 'mock-icon';
  leaf: WorkspaceLeafType;
  override containerEl: MockObsidianElement<'div'>;
  contentEl: MockObsidianElement<'div'>;
  // The mocked app field comes from the component
  app: any;
  // The mocked scope field comes from the component
  scope: any;

  constructor(leaf: WorkspaceLeafType) {
    super();
    this.leaf = leaf;
    this.containerEl = createMockObsidianElement('div');
    this.contentEl = createMockObsidianElement('div');
    this.app = (leaf as any).app || {};
    this.scope = this.app.scope || {};
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
  getState(): any {
    return {};
  }
  setState(_state: any, _result: any): Promise<void> {
    return Promise.resolve();
  }
  getEphemeralState(): any {
    return {};
  }
  setEphemeralState(_state: any): void {
    // Mock implementation
  }
  onHeaderMenu(_menu: any): void {
    // Mock implementation
  }
  onPaneMenu(_menu: any, _source: string): void {
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
  override register: Mock<(cb: () => any) => void> = vi.fn((cb) => cb());
  override registerEvent: Mock<(ref: any) => void> = vi.fn();

  addAction(icon: string, title: string, callback: (evt: MouseEvent) => any): HTMLElement {
    const element = document.createElement('button');
    element.setAttribute('aria-label', title);
    element.onclick = callback;
    return element;
  }
}
