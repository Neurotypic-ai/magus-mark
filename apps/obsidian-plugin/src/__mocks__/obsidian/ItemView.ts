import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
// import { Events } from './MockEvents'; // Will come from Component
import { Component } from './Component'; // Changed from Events

// Added

import type {
  App,
  Component as ComponentType,
  EventRef,
  Menu,
  Scope as ScopeType,
  TFile,
  View as ViewType,
} from 'obsidian';
import type { Mock } from 'vitest';

import type { MockObsidianElement } from './MockObsidianElement';
import type { WorkspaceLeaf } from './WorkspaceLeaf';

/** Minimal ItemView stub */

export class ItemView extends Component implements ViewType {
  app: App;
  icon = '';
  navigation = false;
  leaf: WorkspaceLeaf;
  override containerEl: MockObsidianElement<'div'>;
  scope: ScopeType | null = null;
  file?: TFile | null;

  constructor(leaf: WorkspaceLeaf) {
    super();
    this.leaf = leaf;
    this.containerEl = createMockObsidianElement<'div'>('div');
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
  onPaneMenu(menu: Menu): void {
    console.log('onPaneMenu', menu);
    /* no-op for mock */
  }
  protected async onOpen(): Promise<void> {
    if (typeof this.onload === 'function') (this.onload as Mock<() => void>)();
    return Promise.resolve();
  }
  protected async onClose(): Promise<void> {
    if (typeof this.onunload === 'function') (this.onunload as Mock<() => void>)();
    return Promise.resolve();
  }
  override registerDomEvent: import('vitest').Mock<any[], void> = vi.fn();
  addAction(icon: string, title: string, cb: (evt: MouseEvent) => any): HTMLElement {
    console.log('addAction', icon, title, cb);
    return createMockObsidianElement('div');
  }
  override load: Mock<() => void> = vi.fn<() => void>();
  override onload: Mock<() => void> = vi.fn<() => void>();
  override unload: Mock<() => void> = vi.fn<() => void>();
  override onunload: Mock<() => void> = vi.fn<() => void>();
  getViewContainer(): HTMLElement {
    return this.containerEl;
  }
  override addChild: import('vitest').MockedFunction<<T extends ComponentType>(child: T) => T> = vi.fn(
    <T extends ComponentType>(child: T): T => {
      return child;
    }
  );
  override removeChild: import('vitest').MockedFunction<<T extends ComponentType>(child: T) => T> = vi.fn(
    <T extends ComponentType>(child: T): T => {
      console.warn('removeChild mock: returning component');
      return child;
    }
  );
  override register: Mock<(cb: () => any) => void> = vi.fn((cb: () => any): void => {
    cb();
  });
  override registerEvent: Mock<(eventRef: EventRef) => void> = vi.fn();
  override registerInterval: Mock<(id: number) => number> = vi.fn((_id: number): number => {
    return 0;
  });
}
