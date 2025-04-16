/**
 * VS Code API mock for tests
 */

// Create a mock VSCode interface
const mockVSCode = {
  // Common VS Code namespaces that tests will need
  workspace: {
    getConfiguration: () => ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get: (key: string) => null,
      update: () => Promise.resolve(),
    }),
  },
  window: {
    createStatusBarItem: () => ({
      show: () => {
        /* empty implementation */
      },
      hide: () => {
        /* empty implementation */
      },
      dispose: () => {
        /* empty implementation */
      },
    }),
    createOutputChannel: () => ({
      appendLine: () => {
        /* empty implementation */
      },
      dispose: () => {
        /* empty implementation */
      },
    }),
    showInformationMessage: () => Promise.resolve(undefined),
    showErrorMessage: () => Promise.resolve(undefined),
  },
  commands: {
    registerCommand: () => ({
      dispose: () => {
        /* empty implementation */
      },
    }),
    executeCommand: () => Promise.resolve(),
    getCommands: () => Promise.resolve([]),
  },
  extensions: {
    getExtension: () => undefined,
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
};

export default mockVSCode;
