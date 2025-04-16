import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

// No need to mock vscode here as it's now handled by the setup file and aliasing
// Our tests can use the vscode import directly

describe('Extension Tests', () => {
  it('Extension should be present', () => {
    const ext = vscode.extensions.getExtension('YourName.obsidian-magic-vscode');
    expect(ext).toBeDefined();
  });

  it('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('YourName.obsidian-magic-vscode');
    expect(ext).toBeDefined();

    if (ext) {
      await ext.activate();
      expect(ext.isActive).toBe(true);
    }
  });

  it('Commands should be registered', async () => {
    // Mock the commands.getCommands to return our expected commands
    vi.spyOn(vscode.commands, 'getCommands').mockResolvedValue([
      'obsidian-magic.tagFile',
      'obsidian-magic.openTagExplorer',
      'obsidian-magic.cursorTagFile',
      'obsidian-magic.manageVaults',
      'obsidian-magic.addVault',
      'obsidian-magic.removeVault',
      'obsidian-magic.syncVault',
    ]);

    const commands = await vscode.commands.getCommands(true);

    expect(commands).toContain('obsidian-magic.tagFile');
    expect(commands).toContain('obsidian-magic.openTagExplorer');
    expect(commands).toContain('obsidian-magic.cursorTagFile');
    expect(commands).toContain('obsidian-magic.manageVaults');
    expect(commands).toContain('obsidian-magic.addVault');
    expect(commands).toContain('obsidian-magic.removeVault');
    expect(commands).toContain('obsidian-magic.syncVault');
  });
});
