import { vi } from 'vitest';

import { EventEmitter } from './EventEmitter.mock';

// Define types for VS Code related objects
interface Disposable {
  dispose(): void;
}

interface StatusBarItem extends Disposable {
  text: string;
  tooltip: string;
  command: string;
  show(): void;
}

interface OutputChannel extends Disposable {
  appendLine(value: string): void;
  show(): void;
}

interface TreeView extends Disposable {
  visible: boolean;
}

interface Configuration {
  get<T>(section: string, defaultValue?: T): T;
  update(section: string, value: unknown, configurationTarget?: boolean | number): Promise<void>;
}

interface ConfigurationChangeEvent {
  affectsConfiguration(section: string): boolean;
}

// VS Code enumerations
export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
} as const;

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2,
} as const;

// VS Code window namespace
export const window = {
  createStatusBarItem: vi.fn(
    (): StatusBarItem => ({
      text: '',
      tooltip: '',
      command: '',
      show: vi.fn(),
      dispose: vi.fn(),
    })
  ),
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  createTreeView: vi.fn(
    (): TreeView => ({
      visible: true,
      dispose: vi.fn(),
    })
  ),
  createOutputChannel: vi.fn(
    (_name: string): OutputChannel => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })
  ),
};

// VS Code commands namespace
export const commands = {
  registerCommand: vi.fn(
    (_command: string, _callback: (...args: unknown[]) => unknown): Disposable => ({
      dispose: vi.fn(),
    })
  ),
  executeCommand: vi.fn(),
};

// VS Code workspace namespace
export const workspace = {
  getConfiguration: vi.fn(
    (section: string): Configuration => ({
      get: vi.fn(<T>(key: string, defaultValue?: T): T => {
        if (section === 'obsidianMagic') {
          if (key === 'vaults') return [] as unknown as T;
          if (key === 'openAiApiKey') return 'test-api-key' as unknown as T;
        }
        return defaultValue as T;
      }),
      update: vi.fn(),
    })
  ),
  onDidChangeConfiguration: vi.fn(
    (_listener: (e: ConfigurationChangeEvent) => unknown): Disposable => ({
      dispose: vi.fn(),
    })
  ),
};

// VS Code extensions namespace
export const extensions = {
  getExtension: vi.fn().mockImplementation((extensionId: string) => ({
    id: extensionId,
    isActive: true,
    activate: vi.fn().mockResolvedValue(undefined),
  })),
};

// VS Code env namespace
export const env = {
  appName: 'Visual Studio Code',
};

// VS Code classes
export class ExtensionContext {
  subscriptions: Disposable[] = [];
  extensionPath = '/test/extension/path';
  globalState = {
    get: vi.fn((key: string): unknown => {
      if (key === 'openAiApiKey') return 'test-api-key';
      return undefined;
    }),
    update: vi.fn(),
  };
  secrets = {
    get: vi.fn((key: string): string | undefined => {
      if (key === 'openAiApiKey') return 'test-api-key';
      return undefined;
    }),
    store: vi.fn(),
    delete: vi.fn(),
  };
}

export class TreeItem {
  tooltip = '';
  description = '';
  contextValue = '';
  command = undefined;
  iconPath = undefined;

  constructor(
    public label: string,
    public collapsibleState?: number
  ) {}
}

export class ThemeIcon {
  constructor(
    public id: string,
    public color?: string
  ) {}
}

// Default export of all VS Code mocks for easy module mocking
export default {
  window,
  commands,
  workspace,
  extensions,
  env,
  ExtensionContext,
  EventEmitter,
  StatusBarAlignment,
  TreeItemCollapsibleState,
  TreeItem,
  ThemeIcon,
};
