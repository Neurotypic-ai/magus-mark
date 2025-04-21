import { Events } from 'obsidian';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';

import type { Document } from '@obsidian-magic/core/models/Document';
import type { View } from 'electron';
import type {
  MarkdownFileInfo,
  WorkspaceContainer,
  WorkspaceDocument as WorkspaceDocumentType,
  WorkspaceItem as WorkspaceItemType,
  WorkspaceParent,
  WorkspaceRoot as WorkspaceRootType,
  WorkspaceSidedock as WorkspaceSidedockType,
  Workspace as WorkspaceType,
  WorkspaceWindow as WorkspaceWindowType,
} from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';
import type { WorkspaceLeaf } from './WorkspaceLeaf';

vi.mock('obsidian', () => {
  class WorkspaceItem extends Events implements WorkspaceItemType {
    getRoot: () => WorkspaceRoot = vi.fn();
    getContainer: () => WorkspaceContainer = vi.fn();
    parent: WorkspaceParent;
    constructor(parent: WorkspaceParent) {
      super();
      this.parent = parent;
    }
  }

  class WorkspaceSidedock extends WorkspaceItem implements WorkspaceSidedockType {
    collapsed = false;
    // WorkspaceSidedock
    toggle: () => void = vi.fn();
    collapse: () => void = vi.fn();
    expand: () => void = vi.fn();
  }

  class WorkspaceDocument extends WorkspaceItem implements WorkspaceDocumentType {}
  class WorkspaceWindow extends WorkspaceRoot implements WorkspaceWindowType {
    win: Window = vi.fn();
    doc: Document = vi.fn();
  }
  class WorkspaceRoot extends WorkspaceItem implements WorkspaceRootType {
    getLeaf: () => WorkspaceLeaf = vi.fn();
    win: WorkspaceWindow = vi.fn();
    doc: WorkspaceDocument = vi.fn();
  }

  return {
    WorkspaceSidedock: vi.fn().mockImplementation((parent: WorkspaceParent) => {
      return new WorkspaceSidedock(parent);
    }),
    WorkspaceRoot: vi.fn().mockImplementation(() => {
      return new WorkspaceRoot();
    }),
  };
});
export class Workspace extends Events implements WorkspaceType {
  activeLeaf: WorkspaceLeaf | null = null;
  containerEl: MockObsidianElement = createMockObsidianElement('div');
  layoutReady = true;
  activeEditor: MarkdownFileInfo | null = null;
}
