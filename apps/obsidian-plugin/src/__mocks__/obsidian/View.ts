import { vi } from 'vitest';

import { Component } from './Component';

import type { App, View as ViewType, WorkspaceLeaf } from 'obsidian';

export abstract class View extends Component implements Partial<ViewType> {
  public app!: App;
  public leaf: WorkspaceLeaf;
  public containerEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf) {
    super();
    this.leaf = leaf;
    this.containerEl = document.createElement('div');
  }

  public abstract getViewType(): string;

  public getDisplayText(): string {
    return '';
  }

  public getIcon(): string {
    return 'document';
  }

  public onOpen = vi.fn(async (): Promise<void> => {
    // Mock implementation
  });

  public onClose = vi.fn(async (): Promise<void> => {
    // Mock implementation
  });

  public getState = vi.fn((): Record<string, unknown> => {
    return {};
  });

  public setState = vi.fn(async (_state: Record<string, unknown>): Promise<void> => {
    // Mock implementation
  });
}
