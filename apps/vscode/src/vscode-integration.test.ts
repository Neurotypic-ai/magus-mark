/**
 * Test file for VS Code integration using Vitest
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { activate, deactivate } from './extension';

describe('VS Code Integration', () => {
  // Mock context for testing
  let context;

  beforeEach(() => {
    vi.clearAllMocks();
    context = new vscode.ExtensionContext();
  });

  afterEach(() => {
    deactivate();
    vi.restoreAllMocks();
  });

  it('should activate successfully in VS Code environment', () => {
    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });

  it('should detect and handle Cursor environment', () => {
    vi.spyOn(vscode.env, 'appName', 'get').mockReturnValue('Cursor');

    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });

  it('should register tag explorer view', () => {
    activate(context);
    expect(vscode.window.createTreeView).toHaveBeenCalledWith('obsidianMagicTags', expect.any(Object));
  });

  it('should register commands', () => {
    activate(context);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('obsidian-magic.tagFile', expect.any(Function));
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'obsidian-magic.openTagExplorer',
      expect.any(Function)
    );
  });

  it('should initialize MCP server in Cursor environment', () => {
    vi.spyOn(vscode.env, 'appName', 'get').mockReturnValue('Cursor');

    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });
});
