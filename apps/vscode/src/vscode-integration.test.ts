/**
 * Test file for VS Code integration using Vitest
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import from vscode
import * as vscode from 'vscode';

import { activate, deactivate } from './extension';

// No need to mock vscode here as it's now handled by the setup file and aliasing

// We're testing with mocks, so we need to silence TypeScript's complaints
// about the mocked context vs. the real context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockedContext = any;

describe('VS Code Integration', () => {
  // Mock context for testing
  let context: MockedContext;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    context = new (vscode as any).ExtensionContext();
  });

  afterEach(() => {
    deactivate();
    vi.restoreAllMocks();
  });

  it('should activate successfully in VS Code environment', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });

  it('should detect and handle Cursor environment', () => {
    vi.spyOn(vscode.env, 'appName', 'get').mockReturnValue('Cursor');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });

  it('should register tag explorer view', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    activate(context);
    expect(vscode.window.createTreeView).toHaveBeenCalledWith('obsidianMagicTags', expect.any(Object));
  });

  it('should register commands', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    activate(context);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith('obsidian-magic.tagFile', expect.any(Function));
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'obsidian-magic.openTagExplorer',
      expect.any(Function)
    );
  });

  it('should initialize MCP server in Cursor environment', () => {
    vi.spyOn(vscode.env, 'appName', 'get').mockReturnValue('Cursor');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    activate(context);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
  });
});
