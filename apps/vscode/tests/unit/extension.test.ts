import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { activate, deactivate } from '../../src/extension';

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
    showErrorMessage: vi.fn(),
    activeTextEditor: null,
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: any) => defaultValue),
    })),
  },
  env: {
    appName: 'Visual Studio Code',
  },
  ExtensionContext: class {
    subscriptions: any[] = [];
  },
  StatusBarAlignment: {
    Left: 1,
    Right: 2,
  },
}));

describe('Extension', () => {
  let context: vscode.ExtensionContext;

  beforeEach(() => {
    context = new (vscode as any).ExtensionContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    deactivate();
  });

  it('should activate successfully', () => {
    activate(context);
    expect(context.subscriptions.length).toBeGreaterThan(0);
  });

  it('should register commands on activation', () => {
    activate(context);
    expect(vscode.commands.registerCommand).toHaveBeenCalled();
  });

  it('should create status bar items', () => {
    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });

  it('should detect Cursor environment', () => {
    (vscode.env as any).appName = 'Cursor';
    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(2);
    (vscode.env as any).appName = 'Visual Studio Code';
  });
}); 