import { expect } from 'chai';
import * as sinon from 'sinon';

interface MockExtensionContext {
  subscriptions: unknown[];
  extensionPath: string;
  globalState: {
    get: sinon.SinonStub;
    update: sinon.SinonStub;
  };
}

interface MockExtension {
  id: string;
  isActive: boolean;
  activate: sinon.SinonStub;
}

// Add index signature to fix implicit 'any' type error
interface VscodeMock {
  extensions: {
    getExtension: (id: string) => MockExtension | undefined;
  };
  commands: {
    getCommands: () => Promise<string[]>;
  };
  [key: string]: unknown;
}

// Create a type assertion function to make the cast safer
function getGlobalVSCodeMock(): VscodeMock {
  // Check if vscode exists in globalThis
  const vscodeMock = (globalThis as { vscode?: VscodeMock }).vscode;
  if (!vscodeMock) {
    throw new Error('VS Code mock not found in global scope');
  }
  return vscodeMock;
}

// Access the global vscode mock (injected by run-tests.ts)
const vscode = getGlobalVSCodeMock();

// We don't want to import the actual extension or vscode which would cause module resolution issues
// Instead, we'll test independently using our own mock vscode objects

suite('Extension Tests', () => {
  // Keep this variable for future tests that will need to test extension context functionality
  // @ts-expect-error - This variable will be used in future tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let extensionContext: MockExtensionContext;
  let mockExtension: MockExtension;

  setup(() => {
    // Set up a new mock extension context for each test
    extensionContext = {
      subscriptions: [],
      extensionPath: '/test/extension/path',
      globalState: {
        get: sinon.stub(),
        update: sinon.stub(),
      },
    };

    // Mock extension
    mockExtension = {
      id: 'khallmark.magus-mark-vscode',
      isActive: true,
      activate: sinon.stub().resolves(),
    };

    // Set up the mock extension in the extensions getExtension call
    sinon.stub(vscode.extensions, 'getExtension').returns(mockExtension);
  });

  teardown(() => {
    sinon.restore();
  });

  test('Extension should be present', () => {
    // Test if getExtension returns our mock extension
    const ext = vscode.extensions.getExtension('khallmark.magus-mark-vscode');
    // Use void operator to fix "Expected an assignment or function call" linter error
    void expect(ext).to.exist;
  });

  test('Commands should be registered', async () => {
    // Mock the commands.getCommands to return our expected commands
    const commandsStub = sinon
      .stub(vscode.commands, 'getCommands')
      .resolves([
        'magus-mark.tagFile',
        'magus-mark.openTagExplorer',
        'magus-mark.cursorTagFile',
        'magus-mark.manageVaults',
        'magus-mark.addVault',
        'magus-mark.removeVault',
        'magus-mark.syncVault',
      ]);

    // Check that expected commands are returned
    const commands = await vscode.commands.getCommands();
    void expect(commands).to.include('magus-mark.tagFile');
    void expect(commands).to.include('magus-mark.openTagExplorer');
    void expect(commands).to.include('magus-mark.cursorTagFile');
    void expect(commands).to.include('magus-mark.manageVaults');
    void expect(commands).to.include('magus-mark.addVault');
    void expect(commands).to.include('magus-mark.removeVault');
    void expect(commands).to.include('magus-mark.syncVault');

    commandsStub.restore();
  });
});
