/**
 * VS Code API mock for tests (ESM)
 * This provides a comprehensive mock for the VS Code API with proper TypeScript types
 */

// Create mock types that match the VS Code API
interface MockDisposable {
  dispose: () => void;
}

// Disable linting for mock methods that must match VS Code API but don't use params
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

// Create a comprehensive mock VS Code API
const vscode = {
  // Environment
  env: {
    appName: 'Visual Studio Code',
    language: 'en',
  },

  // Workspace functionality
  workspace: {
    getConfiguration: (_section?: string) => ({
      get: <T>(_key: string, defaultValue?: T): T | undefined => defaultValue,
      update: (_key: string, _value: unknown) => Promise.resolve(),
      has: (_key: string) => false,
    }),
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' },
        name: 'TestWorkspace',
        index: 0,
      },
    ],
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
  },

  // Window functionality
  window: {
    createStatusBarItem: (_alignment?: number, _priority?: number) => ({
      text: '',
      tooltip: '',
      command: '',
      show: () => {},
      hide: () => {},
      dispose: () => {},
    }),
    createOutputChannel: (name: string) => ({
      name,
      append: (_value: string) => {},
      appendLine: (_value: string) => {},
      clear: () => {},
      show: () => {},
      hide: () => {},
      dispose: () => {},
    }),
    showInformationMessage: <T>(..._items: unknown[]): Promise<T | undefined> => Promise.resolve(undefined),
    showWarningMessage: <T>(..._items: unknown[]): Promise<T | undefined> => Promise.resolve(undefined),
    showErrorMessage: <T>(..._items: unknown[]): Promise<T | undefined> => Promise.resolve(undefined),
    showInputBox: (_options?: unknown) => Promise.resolve(''),
    showQuickPick: <T>(_items: T[], _options?: unknown) => Promise.resolve(undefined as unknown as T),
    createTreeView: (_viewId: string, _options: unknown) => ({
      visible: true,
      onDidChangeVisibility: () => ({ dispose: () => {} }),
      reveal: () => Promise.resolve(),
      dispose: () => {},
    }),
    createWebviewPanel: () => ({
      webview: {
        html: '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => Promise.resolve(true),
      },
      onDidDispose: () => ({ dispose: () => {} }),
      reveal: () => {},
      dispose: () => {},
    }),
  },

  // Commands
  commands: {
    registerCommand: (_command: string, _callback: (...args: unknown[]) => unknown): MockDisposable => ({
      dispose: () => {},
    }),
    executeCommand: <T>(_command: string, ..._args: unknown[]): Promise<T | undefined> => Promise.resolve(undefined),
    getCommands: (_filterInternal?: boolean): Promise<string[]> => Promise.resolve([]),
  },

  // Extensions
  extensions: {
    getExtension: (_extensionId: string) => undefined,
    all: [],
  },

  // URI utilities
  Uri: {
    file: (path: string) => ({ fsPath: path, scheme: 'file' }),
    parse: (uri: string) => ({ fsPath: uri, scheme: uri.split(':')[0] ?? 'file' }),
  },

  // TreeItem related
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },

  // ThemeIcon
  ThemeIcon: {
    File: { id: 'file' },
    Folder: { id: 'folder' },
  },
};

export default vscode;
