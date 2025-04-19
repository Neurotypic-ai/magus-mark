/**
 * VS Code API mock for tests (ESM)
 * This provides a comprehensive mock for the VS Code API with proper TypeScript types
 */

import type { Extension, OutputChannel, TreeView, Uri, WorkspaceFolder } from 'vscode';

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
      update: (_key: string, _value: unknown): Promise<void> => Promise.resolve(),
      has: (_key: string): boolean => false,
    }),
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' } as Uri,
        name: 'TestWorkspace',
        index: 0,
      },
    ] as WorkspaceFolder[],
    onDidChangeConfiguration: (): MockDisposable => ({ dispose: () => {} }),
  },

  // Window functionality
  window: {
    createStatusBarItem: (_alignment?: number, _priority?: number) => ({
      text: '',
      tooltip: '',
      command: '',
      show: (): void => {},
      hide: (): void => {},
      dispose: (): void => {},
      replace: (): void => {},
    }),
    createOutputChannel: (name: string): OutputChannel => ({
      name,
      append: (_value: string): void => {},
      appendLine: (_value: string): void => {},
      clear: (): void => {},
      show: (): void => {},
      hide: (): void => {},
      dispose: (): void => {},
      replace: (_value: string): void => {},
    }),
    showInformationMessage: <T>(..._items: unknown[]): Promise<T | undefined> => Promise.resolve(undefined),
    showWarningMessage: <T>(..._items: unknown[]): Promise<T | undefined> => Promise.resolve(undefined),
    showErrorMessage: <T>(..._items: unknown[]): Promise<T | undefined> => Promise.resolve(undefined),
    showInputBox: (_options?: unknown): Promise<string> => Promise.resolve(''),
    showQuickPick: <T>(_items: T[], _options?: unknown): Promise<T> => Promise.resolve(undefined as unknown as T),
    createTreeView: (_viewId: string, _options: unknown): TreeView<unknown> => ({
      visible: true,
      onDidChangeVisibility: () => ({ dispose: () => {} }),
      reveal: () => Promise.resolve(),
      dispose: () => {},
      onDidExpandElement: () => ({ dispose: () => {} }),
      onDidCollapseElement: () => ({ dispose: () => {} }),
      selection: [] as unknown[],
      onDidChangeSelection: () => ({ dispose: () => {} }),
      onDidChangeCheckboxState: () => ({ dispose: () => {} }),
    }),
    createWebviewPanel: () => ({
      webview: {
        html: '',
        onDidReceiveMessage: (): MockDisposable & { dispose: () => void } => ({ dispose: () => {} }),
        postMessage: (): Promise<boolean> => Promise.resolve(true),
      },
      onDidDispose: (): MockDisposable & { dispose: () => void } => ({ dispose: () => {} }),
      reveal: (): Promise<void> => Promise.resolve(),
      dispose: (): void => {},
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
    all: [] as Extension<unknown>[],
  },

  // URI utilities
  Uri: {
    file: (path: string): Uri => ({ fsPath: path, scheme: 'file' }) as Uri,
    parse: (uri: string): Uri => ({ fsPath: uri, scheme: uri.split(':')[0] ?? 'file' }) as Uri,
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
