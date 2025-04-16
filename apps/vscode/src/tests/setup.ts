import { vi } from 'vitest';

// Create mock EventEmitter class directly in this file
class EventEmitter {
  event = vi.fn();
  fire = vi.fn();
  dispose = vi.fn();
}

// Create mock for the VS Code module directly here

vi.mock('vscode', () => {
  // Define interface for disposable objects
  interface Disposable {
    dispose(): void;
  }

  // Define types for VS Code related objects
  const StatusBarAlignment = {
    Left: 1,
    Right: 2,
  };

  const TreeItemCollapsibleState = {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  };

  // VS Code window namespace
  const window = {
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      show: vi.fn(),
      dispose: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInputBox: vi.fn(),
    showQuickPick: vi.fn(),
    createTreeView: vi.fn(() => ({
      visible: true,
      dispose: vi.fn(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createOutputChannel: vi.fn((_: string) => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })),
  };

  // VS Code commands namespace
  const commands = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    registerCommand: vi.fn((_: string, __: (...args: unknown[]) => unknown) => ({
      dispose: vi.fn(),
    })),
    executeCommand: vi.fn(),
    getCommands: vi.fn(() => Promise.resolve([])),
  };

  // VS Code workspace namespace
  const workspace = {
    getConfiguration: vi.fn((section: string) => ({
      get: vi.fn(<T>(key: string, defaultValue?: T): T => {
        if (section === 'obsidianMagic') {
          if (key === 'vaults') return [] as unknown as T;
          if (key === 'openAiApiKey') return 'test-api-key' as unknown as T;
        }
        return defaultValue as T;
      }),
      update: vi.fn(),
    })),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDidChangeConfiguration: vi.fn((_: (e: unknown) => void) => ({
      dispose: vi.fn(),
    })),
    openTextDocument: vi.fn(),
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      delete: vi.fn(),
      rename: vi.fn(),
      stat: vi.fn(),
    },
  };

  // VS Code extensions namespace
  const extensions = {
    getExtension: vi.fn().mockImplementation((extensionId: string) => ({
      id: extensionId,
      isActive: true,
      activate: vi.fn().mockResolvedValue(undefined),
    })),
  };

  // VS Code env namespace
  const env = {
    appName: 'Visual Studio Code',
  };

  // VS Code classes
  class ExtensionContext {
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

  class TreeItem {
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

  class ThemeIcon {
    constructor(
      public id: string,
      public color?: string
    ) {}
  }

  class MarkdownString {
    value = '';
    isTrusted = false;
    supportHtml = false;

    constructor(value = '') {
      this.value = value;
    }

    appendMarkdown(value: string): this {
      this.value += value;
      return this;
    }
  }

  return {
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
    MarkdownString,
    // Additional VS Code APIs that might be needed
    Uri: {
      file: vi.fn((path: string) => ({ path, scheme: 'file' })),
      parse: vi.fn((uri: string) => ({ toString: () => uri })),
    },
    Position: class {
      constructor(
        public line: number,
        public character: number
      ) {}
    },
    Range: class {
      constructor(
        public start: { line: number; character: number },
        public end: { line: number; character: number }
      ) {}
    },
    ViewColumn: {
      Active: -1,
      Beside: -2,
      One: 1,
      Two: 2,
      Three: 3,
    },
  };
});

// Setup fake timers
vi.useFakeTimers();

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
