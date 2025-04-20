import { Events } from 'obsidian';

import { createMockObsidianElement } from './MockObsidianElement';

import type { View } from 'electron';
import type {
  Constructor,
  TFile,
  WorkspaceLeaf,
  WorkspaceMobileDrawer,
  WorkspaceRoot,
  WorkspaceSidedock,
} from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';

export class Workspace extends Events implements WorkspaceType {
  activeLeaf: WorkspaceLeafType | null = null;
  leftSplit: WorkspaceSidedock | WorkspaceMobileDrawer = {};
  rightSplit: WorkspaceSidedock | WorkspaceMobileDrawer = {};
  rootSplit: WorkspaceRoot = {};
  containerEl: MockObsidianElement = createMockObsidianElement('div');
  layoutReady = true;
  activeEditor: unknown = null;
  on(): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  }
  onLayoutReady(cb: () => void): void {
    cb();
  }
  getLeaf(): WorkspaceLeafType {
    if (!this.activeLeaf) {
      this.activeLeaf = new WorkspaceLeaf();
    }
    return this.activeLeaf;
  }
  getActiveViewOfType<T extends View>(type: Constructor<T>): T | null {
    return null;
  }
  getActiveFile(): TFile | null {
    return null;
  }
  revealLeaf(): Promise<void> {
    return Promise.resolve();
  }
  getLeavesOfType(): WorkspaceLeaf[] {
    return [];
  }
  detachLeavesOfType(): void {
    /* no-op for mock */
  }
  getRightLeaf: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  changeLayout: () => void = vi.fn().mockResolvedValue(undefined);
  getLayout: () => Record<string, unknown> = vi.fn().mockReturnValue({});
  createLeafInParent: () => WorkspaceLeaf = vi.fn().mockReturnValue(new WorkspaceLeaf());
  createLeafBySplit: () => WorkspaceLeaf = vi.fn().mockReturnValue(new WorkspaceLeaf());
  duplicateLeaf: () => Promise<WorkspaceLeaf> = vi.fn().mockResolvedValue(new WorkspaceLeaf());
  moveLeafToPopout: () => void = vi.fn();
  openPopoutLeaf: () => Promise<WorkspaceLeaf> = vi.fn().mockReturnValue(new WorkspaceLeaf());
  openLinkText: () => Promise<void> = vi.fn().mockResolvedValue(undefined);
  setActiveLeaf: () => void = vi.fn();
  getLeafById: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  getGroupLeaves: () => WorkspaceLeaf[] = vi.fn().mockReturnValue([]);
  getMostRecentLeaf: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  getLeftLeaf: () => WorkspaceLeaf | null = vi.fn().mockReturnValue(null);
  ensureSideLeaf: () => Promise<WorkspaceLeaf> = vi.fn().mockResolvedValue(new WorkspaceLeaf());
  iterateRootLeaves: () => void = vi.fn();
  iterateAllLeaves: () => void = vi.fn();
  getLastOpenFiles: () => TFile[] = vi.fn().mockReturnValue([]);
  updateOptions: () => void = vi.fn();
}
