import * as vscode from 'vscode';
import { MCPServer } from './cursor/mcp-server';
import { registerTagExplorer } from './views/tag-explorer';
import { VaultIntegrationService } from './services/vault-integration';

// Store the MCP server instance for access from commands
let mcpServer: MCPServer | undefined;
// Store the vault integration service instance
let vaultService: VaultIntegrationService | undefined;

/**
 * Extension activation - called when the extension is first loaded
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Activating Obsidian Magic VS Code Extension');

  // Initialize the vault integration service
  vaultService = new VaultIntegrationService(context);
  context.subscriptions.push(vaultService);

  // Check if running in Cursor
  const isCursorEnvironment = vscode.env.appName.includes('Cursor');
  
  // Check user configuration for Cursor features
  const config = vscode.workspace.getConfiguration('obsidianMagic');
  const cursorFeaturesEnabled = config.get<boolean>('cursorFeatures.enabled', true);
  
  if (isCursorEnvironment && cursorFeaturesEnabled) {
    console.log('Cursor environment detected, initializing Cursor-specific features');
    activateCursorFeatures(context);
  } else if (isCursorEnvironment && !cursorFeaturesEnabled) {
    console.log('Cursor environment detected, but Cursor features are disabled in settings');
  } else {
    console.log('Running in standard VS Code environment');
  }

  // Register standard VS Code commands
  registerCommands(context);

  // Initialize extension features
  initializeExtension(context);
  
  // Show vault status in status bar
  createVaultStatusBar(context);
}

/**
 * Create a status bar item for vault status
 */
function createVaultStatusBar(context: vscode.ExtensionContext): void {
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = '$(database) Obsidian Vault';
  statusBarItem.tooltip = 'Manage Obsidian Vaults';
  statusBarItem.command = 'obsidian-magic.manageVaults';
  statusBarItem.show();
  
  context.subscriptions.push(statusBarItem);
  
  // Update status bar when vaults change
  if (vaultService) {
    vaultService.onVaultChanged(() => {
      const vaults = vaultService?.getVaults() || [];
      statusBarItem.text = vaults.length > 0 
        ? `$(database) Obsidian Vaults (${vaults.length})` 
        : '$(database) Obsidian Vault';
    });
  }
}

/**
 * Activate Cursor-specific features including the MCP server
 */
function activateCursorFeatures(context: vscode.ExtensionContext): void {
  // Initialize the MCP server for Cursor integration
  mcpServer = new MCPServer();
  
  // Store the server instance in the context for disposal on deactivation
  context.subscriptions.push(mcpServer);
  
  // Register Cursor-specific commands
  registerCursorCommands(context);
  
  // Create status bar item to show Cursor integration status
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(cursor) @vscode';
  statusBarItem.tooltip = '@vscode participant active';
  statusBarItem.command = 'obsidian-magic.cursorRegisterVSCodeParticipant';
  statusBarItem.show();
  
  context.subscriptions.push(statusBarItem);
  
  console.log('@vscode participant initialized in Cursor environment');
}

/**
 * Register Cursor-specific commands
 */
function registerCursorCommands(context: vscode.ExtensionContext): void {
  // Command to tag current file with Cursor AI assistance
  const cursorTagCommand = vscode.commands.registerCommand('obsidian-magic.cursorTagFile', async () => {
    if (!mcpServer) {
      vscode.window.showErrorMessage('Cursor integration not initialized');
      return;
    }
    
    // Get active editor document
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active file to tag');
      return;
    }
    
    // In a real implementation, this would use the MCP server to call an AI model
    // For now, just show an information message
    vscode.window.showInformationMessage('Tagging current file with Cursor AI assistance');
  });
  
  // Command to manually register @vscode participant
  const registerVSCodeParticipantCommand = vscode.commands.registerCommand('obsidian-magic.cursorRegisterVSCodeParticipant', async () => {
    if (!mcpServer) {
      const response = await vscode.window.showInformationMessage(
        'Cursor integration is not initialized. Would you like to initialize it?',
        'Yes',
        'No'
      );
      
      if (response === 'Yes') {
        mcpServer = new MCPServer();
        context.subscriptions.push(mcpServer);
        vscode.window.showInformationMessage('@vscode participant initialized successfully');
      }
      return;
    }
    
    vscode.window.showInformationMessage('@vscode participant is already registered');
  });
  
  context.subscriptions.push(cursorTagCommand, registerVSCodeParticipantCommand);
}

/**
 * Register standard VS Code commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Register standard tag file command
  const tagCommand = vscode.commands.registerCommand('obsidian-magic.tagFile', async () => {
    // Get active editor document
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active file to tag');
      return;
    }
    
    // Handle standard tagging functionality
    vscode.window.showInformationMessage('Tagging current file');
  });
  
  // Register explorer view command
  const explorerCommand = vscode.commands.registerCommand('obsidian-magic.openTagExplorer', async () => {
    // Focus the tag explorer view
    await vscode.commands.executeCommand('obsidianMagicTagExplorer.focus');
    vscode.window.showInformationMessage('Tag Explorer opened');
  });
  
  // Register vault management command
  const manageVaultsCommand = vscode.commands.registerCommand('obsidian-magic.manageVaults', async () => {
    const options = ['Add Vault', 'Remove Vault', 'Sync Vaults'];
    const choice = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select Vault Action'
    });
    
    if (choice === 'Add Vault') {
      await vscode.commands.executeCommand('obsidian-magic.addVault');
    } else if (choice === 'Remove Vault') {
      await vscode.commands.executeCommand('obsidian-magic.removeVault');
    } else if (choice === 'Sync Vaults') {
      await vscode.commands.executeCommand('obsidian-magic.syncVault');
    }
  });
  
  context.subscriptions.push(tagCommand, explorerCommand, manageVaultsCommand);
}

/**
 * Initialize core extension features
 */
function initializeExtension(context: vscode.ExtensionContext): void {
  // Initialize tag explorer view
  const tagExplorerView = registerTagExplorer(context);
  context.subscriptions.push(tagExplorerView);
  
  // Set up any event listeners
  
  // Initialize any other extension features
}

/**
 * Extension deactivation - called when the extension is unloaded
 */
export function deactivate(): void {
  console.log('Deactivating Obsidian Magic VS Code Extension');
  // Resources disposed automatically via context.subscriptions
  mcpServer = undefined;
  vaultService = undefined;
}
