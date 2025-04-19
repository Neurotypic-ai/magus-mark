/**
 * VS Code API mock for tests
 */

import type { Uri } from 'vscode';

// Create a mock VSCode interface
const mockVSCode = {
  // Common VS Code namespaces that tests will need
  workspace: {
    getConfiguration: (): unknown => ({
       
      get: (key: string): unknown => {
        console.log('getConfiguration', key);
        return null;
      },
      update: (): void => {
        /* empty implementation */
      },
    }),
  },
  window: {
    createStatusBarItem: () => ({
      show: (): void => {
        /* empty implementation */
      },
      hide: (): void => {
        /* empty implementation */
      },
      dispose: (): void => {
        /* empty implementation */
      },
    }),
    createOutputChannel: () => ({
      appendLine: (): void => {
        /* empty implementation */
      },
      dispose: (): void => {
        /* empty implementation */
      },
    }),
    showInformationMessage: (): Promise<unknown> => Promise.resolve(undefined),
    showErrorMessage: (): Promise<unknown> => Promise.resolve(undefined),
  },
  commands: {
    registerCommand: () => ({
      dispose: (): void => {
        /* empty implementation */
      },
    }),
    executeCommand: (): Promise<unknown> => Promise.resolve(),
    getCommands: (): Promise<string[]> => Promise.resolve([]),
  },
  extensions: {
    getExtension: (): unknown => undefined,
  },
  Uri: {
    file: (path: string): Uri => ({ fsPath: path }) as Uri,
  },
};

export default mockVSCode;
