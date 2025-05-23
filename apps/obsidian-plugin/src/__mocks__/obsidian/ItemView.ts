import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Component } from '../obsidian';

import type { App, TFile } from 'obsidian';
import type { Mock } from 'vitest';

import type { WorkspaceLeaf } from './WorkspaceLeaf';

export class ItemView extends Component {
  file?: TFile | null;
  app: App;
  leaf: WorkspaceLeaf;
  containerEl: HTMLElement;
  contentEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    super();
    this.leaf = leaf;
    this.containerEl = createMockObsidianElement<'div'>('div');
    this.contentEl = createMockObsidianElement<'div'>('div');
    this.app = leaf.app as unknown as App;

    // Make instance methods mockable
    this.addAction = vi.fn(this.addAction.bind(this));
  }

  addAction(icon: string, title: string, cb: (evt: MouseEvent) => any): HTMLElement {
    console.log('addAction', icon, title, cb);
    return createMockObsidianElement('div');
  }

  getViewContainer(): HTMLElement {
    return this.containerEl;
  }

  // Override Component methods to make them mockable if needed
  override load: Mock<() => void> = vi.fn();
  override onload: Mock<() => void> = vi.fn();
  override unload: Mock<() => void> = vi.fn();
  override onunload: Mock<() => void> = vi.fn();
  override register: Mock<(cb: () => any) => void> = vi.fn((cb) => cb());
  override registerEvent: Mock<(ref: any) => void> = vi.fn();
  override registerInterval: Mock<(id: number) => number> = vi.fn((id) => id || window.setInterval(vi.fn(), 1000));
  override registerDomEvent: Mock<
    (el: EventTarget, type: string, callback: (evt: any) => any, options?: boolean | AddEventListenerOptions) => void
  > = vi.fn();
}
