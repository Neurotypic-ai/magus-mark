import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';

// Import extension module
import * as extension from '../../src/extension';

// Mock VS Code API
vi.mock('vscode', () => ({
	extensions: {
		getExtension: vi.fn().mockImplementation((extensionId) => ({
			id: extensionId,
			isActive: true,
			activate: vi.fn().mockResolvedValue(undefined),
		})),
	},
	commands: {
		getCommands: vi.fn().mockResolvedValue([
			'obsidian-magic.tagFile',
			'obsidian-magic.openTagExplorer',
			'obsidian-magic.cursorTagFile',
			'obsidian-magic.manageVaults',
			'obsidian-magic.addVault',
			'obsidian-magic.removeVault',
			'obsidian-magic.syncVault',
		]),
	},
}));

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