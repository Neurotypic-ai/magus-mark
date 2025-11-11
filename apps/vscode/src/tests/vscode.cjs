/**
 * VS Code API mock for tests (CommonJS)
 * This file exports the mock object.
 */

const vscodeMock = {
  workspace: {
    getConfiguration: () => ({
      get: () => null,
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
    showWarningMessage: () => Promise.resolve(undefined), // Added for delete test later
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
    /** @param {string} path */
    file: (path) => ({ fsPath: path }),
  },
  // Add necessary enums/classes used by tests
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
};

module.exports = vscodeMock;
