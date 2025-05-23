import { vi } from 'vitest';

import { createMockObsidianElement } from '../../testing/createMockObsidianElement';
import { Events } from './MockEvents';

import type {
  Debouncer,
  EventRef,
  MarkdownFileInfo,
  OpenViewState,
  Side,
  SplitDirection,
  TFile,
  View,
  WorkspaceItem as WorkspaceItemType,
  WorkspaceRoot as WorkspaceRootType,
  WorkspaceSidedock as WorkspaceSidedockType,
  WorkspaceSplit,
  WorkspaceTabs,
  Workspace as WorkspaceType,
  WorkspaceWindow as WorkspaceWindowType,
} from 'obsidian';

import type { MockObsidianElement } from './MockObsidianElement';
import type { WorkspaceLeaf } from './WorkspaceLeaf';

type Constructor<T = any> = new (...args: any[]) => T;
type PaneType = boolean | 'split' | 'tab' | 'window';

export class Workspace extends Events implements WorkspaceType {
  activeLeaf: WorkspaceLeaf | null = null;
  containerEl: MockObsidianElement = createMockObsidianElement('div');
  layoutReady = true;
  activeEditor: MarkdownFileInfo | null = null;

  leftSplit: WorkspaceSidedockType = {} as WorkspaceSidedockType;
  rightSplit: WorkspaceSidedockType = {} as WorkspaceSidedockType;
  leftRibbon: any = { show: vi.fn(), hide: vi.fn(), addAction: vi.fn(), removeAction: vi.fn() };
  rightRibbon: any = { show: vi.fn(), hide: vi.fn(), addAction: vi.fn(), removeAction: vi.fn() };
  headerInfoEl: HTMLElement = document.createElement('div');
  statusBar: any = {
    containerEl: document.createElement('div'),
    addStatusBarItem: vi.fn(),
    removeStatusBarItem: vi.fn(),
  };
  floatingSplit: WorkspaceSplit | null = null;
  rootSplit: WorkspaceRootType = {} as WorkspaceRootType;
  activeTabGroup: WorkspaceTabs | null = null;

  requestSaveLayout: Debouncer<[], Promise<void>> = (() => {
    const fn = vi.fn((): Promise<void> => Promise.resolve());
    (fn as any).cancel = vi.fn();
    (fn as any).run = vi.fn((): Promise<void> => Promise.resolve());
    (fn as any).destroy = vi.fn();
    return fn as any as Debouncer<[], Promise<void>>;
  })();
  onLayoutReady: (callback: () => any) => void = vi.fn();
  getLayout: () => any = vi.fn(() => ({}));
  setLayout: (layout: any) => Promise<void> = vi.fn(() => Promise.resolve());
  openPopoutLeaf: () => WorkspaceLeaf = vi.fn();
  openPopout: () => Promise<WorkspaceWindowType> = vi.fn(() => Promise.resolve({} as WorkspaceWindowType));
  openWindow: () => Promise<WorkspaceWindowType> = vi.fn(() => Promise.resolve({} as WorkspaceWindowType));
  getLeaf: (newLeaf?: boolean | PaneType) => WorkspaceLeaf = vi.fn();
  getLeftLeaf: (sticky?: boolean) => WorkspaceLeaf = vi.fn();
  getRightLeaf: (sticky?: boolean) => WorkspaceLeaf = vi.fn();
  getUnpinnedLeaves: (type?: string) => WorkspaceLeaf[] = vi.fn(() => []);
  getLeafById: (id: string) => WorkspaceLeaf | null = vi.fn(() => null);
  getLeavesOfType: (viewType: string) => WorkspaceLeaf[] = vi.fn(() => []);
  getMostRecentLeaf: (root?: WorkspaceRootType | WorkspaceItemType) => WorkspaceLeaf | null = vi.fn(() => null);
  createLeafBySplit: (split: WorkspaceSplit, viewType?: string, options?: any) => WorkspaceLeaf = vi.fn();
  createLeafInParent: (parentSplit: WorkspaceSplit, index?: number) => WorkspaceLeaf = vi.fn();
  createLeafInTabGroup: (group: WorkspaceTabs, index?: number) => WorkspaceLeaf = vi.fn();
  splitActiveLeaf: (direction?: SplitDirection, before?: boolean) => WorkspaceLeaf = vi.fn();
  setActiveLeaf: ((leaf: WorkspaceLeaf, params?: { focus?: boolean }) => void) &
    ((leaf: WorkspaceLeaf, pushHistory: boolean, focus: boolean) => void) = vi.fn();
  openLinkText: (
    linktext: string,
    sourcePath: string,
    newLeaf?: PaneType,
    openViewState?: OpenViewState
  ) => Promise<void> = vi.fn(() => Promise.resolve());
  openFile: (file: TFile, openViewState?: OpenViewState) => Promise<void> = vi.fn(() => Promise.resolve());
  getDropLocation: (event: DragEvent) => {
    target: WorkspaceItemType | null;
    aSide: 'left' | 'right' | 'top' | 'bottom' | null;
    bSide: 'v' | 'h' | null;
  } = vi.fn(() => ({ target: null, aSide: null, bSide: null }));
  iterateRootLeaves: (callback: (leaf: WorkspaceLeaf) => any) => void = vi.fn();
  iterateAllLeaves: (callback: (leaf: WorkspaceLeaf) => any) => void = vi.fn();
  getAdjacentLeaf: (leaf: WorkspaceLeaf, direction: 'top' | 'bottom' | 'left' | 'right') => WorkspaceLeaf | null =
    vi.fn(() => null);
  getActiveViewOfType: <T_1 extends View>(type: Constructor<T_1>) => T_1 | null = vi.fn();
  getActiveFile: () => TFile | null = vi.fn(() => null);
  updateOptions: () => void = vi.fn();

  changeLayout: (layout: any) => Promise<void> = vi.fn((_layout: any): Promise<void> => Promise.resolve());
  getUnpinnedLeaf: (type?: string) => WorkspaceLeaf = vi.fn((_type?: string): WorkspaceLeaf => ({}) as WorkspaceLeaf);
  getGroupLeaves: (group: string) => WorkspaceLeaf[] = vi.fn((_group: string): WorkspaceLeaf[] => []);
  ensureSideLeaf: (
    type: string,
    side: Side,
    options?: { active?: boolean; split?: boolean; reveal?: boolean; state?: any }
  ) => Promise<WorkspaceLeaf> = vi.fn(
    (
      _type: string,
      _side: Side,
      _options?: { active?: boolean; split?: boolean; reveal?: boolean; state?: any }
    ): Promise<WorkspaceLeaf> => Promise.resolve({} as WorkspaceLeaf)
  );

  override on: (...args: any[]) => EventRef = vi.fn((..._args: any[]): EventRef => ({}) as EventRef);
  override off: (...args: any[]) => void = vi.fn((..._args: any[]): void => {});
  override offref: (...args: any[]) => void = vi.fn((..._args: any[]): void => {});
  override trigger: (...args: any[]) => void = vi.fn((..._args: any[]): void => {});
  override tryTrigger: (...args: any[]) => boolean = vi.fn((..._args: any[]): boolean => false);

  constructor() {
    super();
  }

  onFileOpen: EventRef = {} as EventRef;
  onLayoutChange: EventRef = {} as EventRef;
  onActiveLeafChange: EventRef = {} as EventRef;
  createLeafInNewWindow: (viewType?: string, options?: any) => WorkspaceLeaf = vi.fn();
  duplicateLeaf: (leaf: WorkspaceLeaf, directionOrOptions?: SplitDirection | PaneType) => Promise<WorkspaceLeaf> =
    vi.fn(() => Promise.resolve({} as WorkspaceLeaf));
  detachLeavesOfType: (viewType: string) => void = vi.fn();
  revealLeaf: (leaf: WorkspaceLeaf) => Promise<void> = vi.fn(() => Promise.resolve());
  getLastOpenFiles: () => string[] = vi.fn(() => []);
  addToSameGroup: (leaf: WorkspaceLeaf, target: WorkspaceLeaf) => void = vi.fn();
  closePopout: () => Promise<void> = vi.fn(() => Promise.resolve());
  moveLeafToPopout: (
    leaf: WorkspaceLeaf,
    dimensions?: { x: number; y: number; width: number; height: number }
  ) => WorkspaceWindowType = vi.fn(() => ({}) as WorkspaceWindowType);
  openParentLeaf: (leaf: WorkspaceLeaf) => WorkspaceLeaf | null = vi.fn(() => null);
}
