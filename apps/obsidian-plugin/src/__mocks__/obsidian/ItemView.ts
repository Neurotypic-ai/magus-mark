import { View } from 'obsidian';
import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';

import type { App, Component as ComponentType, EventRef, TFile } from 'obsidian';
import type { Mock } from 'vitest';

import type { WorkspaceLeaf } from './WorkspaceLeaf';

export class ItemView extends View implements ComponentType {
  file?: TFile | null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.leaf = leaf;
    this.containerEl = createMockObsidianElement<'div'>('div');
    this.app = leaf.app as unknown as App;
  }
  getViewType(): string {
    return 'mock-item-view';
  }
  getDisplayText(): string {
    return 'Mock Item View';
  }
  override registerDomEvent: Mock<(...args: any[]) => void> = vi.fn();
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
  override addChild: <T extends ComponentType>(child: T) => T = vi.fn(<T extends ComponentType>(child: T): T => {
    return child;
  });
  override removeChild: <T extends ComponentType>(child: T) => T = vi.fn(<T extends ComponentType>(child: T): T => {
    console.warn('removeChild mock: returning component');
    return child;
  });
  override register: Mock<(cb: () => any) => void> = vi.fn((cb: () => any): void => {
    cb();
  });
  override registerEvent: Mock<(eventRef: EventRef) => void> = vi.fn();
  override registerInterval: Mock<(id: number) => number> = vi.fn((_id: number): number => {
    return 0;
  });
}
