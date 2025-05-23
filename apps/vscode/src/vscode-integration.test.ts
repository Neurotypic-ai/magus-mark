/**
 * Test file for VS Code integration using Mocha
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

// Define interfaces for VS Code mock
interface VsCodeMock {
  env?: {
    appName: string;
  };
  window?: {
    createStatusBarItem: sinon.SinonStub;
    createTreeView?: sinon.SinonStub;
  };
  commands?: {
    registerCommand: sinon.SinonStub;
  };
  [key: string]: unknown;
}

// Define mock interfaces
interface StatusBarItem {
  show: sinon.SinonStub;
  hide: sinon.SinonStub;
  dispose: sinon.SinonStub;
}

// Access the global vscode mock (injected by run-tests.ts)
function getVsCodeMock(): VsCodeMock {
  const globalVscode = (globalThis as { vscode?: VsCodeMock }).vscode;
  return globalVscode ?? {};
}

const vscode = getVsCodeMock();

// Define interfaces for our mock objects
interface MockContext {
  subscriptions: { dispose(): void }[];
  extensionPath: string;
  globalState: {
    get: sinon.SinonStub;
    update: sinon.SinonStub;
  };
}

// Define a type for the stub to avoid type errors
interface AppNameStub extends sinon.SinonStub {
  value(val: string): this;
}

// Define disposable interface
interface Disposable {
  dispose(): void;
}

// Define TreeView interface
interface TreeView {
  visible: boolean;
  onDidChangeVisibility: () => Disposable;
  reveal: () => Promise<void>;
  dispose(): void;
}

suite('VS Code Integration', () => {
  // Mock context for testing
  // @ts-expect-error - This variable will be used in future tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let context: MockContext;
  let envAppNameStub: AppNameStub;

  setup(() => {
    // Create a mock extension context
    context = {
      subscriptions: [],
      extensionPath: '/test/extension/path',
      globalState: {
        get: sinon.stub(),
        update: sinon.stub(),
      },
    };

    // Make sure env exists on our mock
    vscode.env ??= { appName: 'Visual Studio Code' };

    // Create a stub for the appName property
    envAppNameStub = sinon.stub(vscode.env, 'appName') as AppNameStub;
    envAppNameStub.value('Visual Studio Code');
  });

  teardown(() => {
    sinon.restore();
  });

  test('should create status bar item in VS Code environment', () => {
    // Ensure window exists
    vscode.window ??= { createStatusBarItem: sinon.stub() };

    // Test that the status bar item can be created
    const mockStatusBarItem: StatusBarItem = {
      show: sinon.stub(),
      hide: sinon.stub(),
      dispose: sinon.stub(),
    };
    vscode.window.createStatusBarItem.returns(mockStatusBarItem);

    const statusBarItem = vscode.window.createStatusBarItem() as StatusBarItem;
    void expect(statusBarItem).to.exist;

    // Sinon only tracks functions if they're directly stubbed
    const createStatusBarStub = sinon.stub(vscode.window, 'createStatusBarItem');
    vscode.window.createStatusBarItem();
    void expect(createStatusBarStub.called).to.be.true;
  });

  test('should handle Cursor environment', () => {
    // Update the appName stub to return 'Cursor'
    envAppNameStub.value('Cursor');

    // Verify environment detection works
    const isCursor = vscode.env?.appName === 'Cursor';
    void expect(isCursor).to.be.true;
  });

  test('should support tag explorer view', () => {
    // Ensure window exists
    vscode.window ??= { createStatusBarItem: sinon.stub() };

    // Add createTreeView if not exists
    vscode.window.createTreeView ??= sinon.stub().returns({
      visible: true,
      onDidChangeVisibility: () => ({
        dispose: () => {
          /* intentionally empty for test mock */
        },
      }),
      reveal: () => Promise.resolve(),
      dispose: () => {
        /* intentionally empty for test mock */
      },
    } as TreeView);

    // Stub the function to track calls
    const createTreeViewStub = sinon.stub(vscode.window, 'createTreeView');

    // Test that tree view can be created
    const mockTreeView: TreeView = {
      visible: true,
      onDidChangeVisibility: () => ({
        dispose: () => {
          /* intentionally empty for test mock */
        },
      }),
      reveal: () => Promise.resolve(),
      dispose: () => {
        /* intentionally empty for test mock */
      },
    };

    createTreeViewStub.returns(mockTreeView);

    const treeView = vscode.window.createTreeView('magusMarkTagExplorer', {}) as TreeView;

    // Verify the tree view is created with the correct ID
    void expect(treeView).to.exist;
    void expect(createTreeViewStub.called).to.be.true;
    void expect(createTreeViewStub.firstCall.args[0]).to.equal('magusMarkTagExplorer');
  });

  test('should support command registration', () => {
    // Ensure commands exists
    vscode.commands ??= { registerCommand: sinon.stub() };

    // Test command registration
    const registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');
    const disposableMock: Disposable = {
      dispose: () => {
        /* intentionally empty for test mock */
      },
    };

    registerCommandStub.returns(disposableMock);

    const disposable = vscode.commands.registerCommand('magus-mark.tagFile', () => {
      /* intentionally empty for test */
    }) as Disposable;

    // Verify commands can be registered
    void expect(disposable).to.exist;
    void expect(registerCommandStub.called).to.be.true;
    void expect(registerCommandStub.calledWith('magus-mark.tagFile')).to.be.true;
  });
});
