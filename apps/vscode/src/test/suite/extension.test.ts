import * as assert from 'assert';

import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  // Before all tests, activate the extension
  suiteSetup(async () => {
    // Get the API
    const extension = vscode.extensions.getExtension('khallmark.obsidian-magic-vscode');
    if (!extension) {
      assert.fail('Extension not found');
    }

    // Activate the extension if it's not already active
    if (!extension.isActive) {
      await extension.activate();
    }
  });

  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('khallmark.obsidian-magic-vscode');
    assert.ok(extension);
  });

  test('Extension should activate successfully', async () => {
    const extension = vscode.extensions.getExtension('khallmark.obsidian-magic-vscode');
    assert.ok(extension);
    assert.strictEqual(extension.isActive, true);
  });

  test('Commands should be registered', async () => {
    // Get the list of all commands
    const commands = await vscode.commands.getCommands(true);

    // Check that our commands are registered
    assert.ok(commands.includes('obsidian-magic.tagFile'));
    assert.ok(commands.includes('obsidian-magic.openTagExplorer'));
  });
});
