import { View } from 'obsidian';
import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';

import type { App, Component as ComponentType, TFile } from 'obsidian';

import type { WorkspaceLeaf } from './WorkspaceLeaf';

export class ItemView extends View implements ComponentType {
  file?: TFile | null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.leaf = leaf;
    this.containerEl = createMockObsidianElement<'div'>('div');
    this.app = leaf.app as unknown as App;

    // Make instance methods mockable
    this.addAction = vi.fn(this.addAction.bind(this));
    this.load = vi.fn(this.load.bind(this));
    this.onload = vi.fn(this.onload.bind(this));
    this.unload = vi.fn(this.unload.bind(this));
    this.onunload = vi.fn(this.onunload.bind(this));
    this.getViewContainer = vi.fn(this.getViewContainer.bind(this));
    this.addChild = vi.fn(this.addChild.bind(this));
    this.removeChild = vi.fn(this.removeChild.bind(this));
    this.register = vi.fn(this.register.bind(this));
    this.registerEvent = vi.fn(this.registerEvent.bind(this));
    this.registerInterval = vi.fn(this.registerInterval.bind(this));
  }

  getViewType(): string {
    return 'mock-item-view';
  }

  getDisplayText(): string {
    return 'Mock Item View';
  }

  addAction(icon: string, title: string, cb: (evt: MouseEvent) => any): HTMLElement {
    console.log('addAction', icon, title, cb);
    return createMockObsidianElement('div');
  }

  getViewContainer(): HTMLElement {
    return this.containerEl;
  }
}
