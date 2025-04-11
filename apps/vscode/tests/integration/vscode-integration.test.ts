import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { activate, deactivate } from '../../src/extension';
import { MCPServer } from '../../src/cursor/mcp-server';
import { TagExplorer } from '../../src/views/tag-explorer';

// Mock VS Code API
vi.mock('vscode', () => ({
  window: {
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      show: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    createTreeView: vi.fn(() => ({
      dispose: vi.fn(),
    })),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
    })),
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: any) => defaultValue),
    })),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
  },
  env: {
    appName: 'Visual Studio Code',
  },
  ExtensionContext: class {
    subscriptions: any[] = [];
    extensionPath = '/test/extension/path';
    globalState = {
      get: vi.fn(),
      update: vi.fn(),
    };
  },
  EventEmitter: class {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2,
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  TreeItem: class {
    constructor(public label: string, public collapsibleState?: number) {}
    tooltip = '';
    description = '';
    contextValue = '';
    command = undefined;
    iconPath = undefined;
  },
  ThemeIcon: class {
    constructor(public id: string, public color?: any) {}
  },
}));

// Mock WebSocket
vi.mock('websocket', () => ({
  server: class {
    constructor() {}
    on = vi.fn();
    mount = vi.fn();
  },
  connection: class {
    on = vi.fn();
    sendUTF = vi.fn();
    close = vi.fn();
  },
}));

// Mock HTTP
vi.mock('http', () => ({
  createServer: vi.fn(() => ({
    listen: vi.fn((port, callback) => callback()),
    close: vi.fn(),
  })),
}));

describe('VS Code Integration', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    context = new (vscode as any).ExtensionContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    deactivate();
  });

  it('should activate successfully in VS Code environment', () => {
    activate(context);
    expect(context.subscriptions.length).toBeGreaterThan(0);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });

  it('should detect and handle Cursor environment', () => {
    (vscode.env as any).appName = 'Cursor';
    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(2);
    // Reset environment
    (vscode.env as any).appName = 'Visual Studio Code';
  });

  it('should register tag explorer view', () => {
    activate(context);
    expect(vscode.window.createTreeView).toHaveBeenCalledWith(
      'obsidianMagicTagExplorer',
      expect.any(Object)
    );
  });

  it('should register commands', () => {
    activate(context);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'obsidian-magic.tagFile',
      expect.any(Function)
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'obsidian-magic.openTagExplorer',
      expect.any(Function)
    );
  });

  it('should initialize MCP server in Cursor environment', () => {
    (vscode.env as any).appName = 'Cursor';
    activate(context);
    // Check if MCPServer was initialized
    expect(context.subscriptions.some(item => 
      item instanceof MCPServer
    )).toBe(true);
    // Reset environment
    (vscode.env as any).appName = 'Visual Studio Code';
  });
}); 