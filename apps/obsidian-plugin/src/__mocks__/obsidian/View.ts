import { vi } from 'vitest';

import { Component } from './Component';

import type { View as ViewType, WorkspaceLeaf } from 'obsidian';

export abstract class View extends Component implements Partial<ViewType> {
  public app: any;
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

  public getState = vi.fn((): any => {
    return {};
  });

  public setState = vi.fn(async (state: any): Promise<void> => {
    // Mock implementation
  });
}
