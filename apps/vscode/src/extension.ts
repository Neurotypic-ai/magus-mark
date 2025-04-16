import * as path from 'path';

import * as vscode from 'vscode';

import { LanguageModelAPI } from './cursor/LanguageModelAPI';
import { MCPServer } from './cursor/MCPServer';
import { VaultIntegrationService } from './services/VaultIntegrationService';
import { registerTagExplorer } from './views/tag-explorer';

// Store service instances for access from commands
let mcpServer: MCPServer | undefined;
let vaultService: VaultIntegrationService | undefined;
let languageModelAPI: LanguageModelAPI | undefined;

/**
 * Generate HTML for the response webview
 * @param query The query being responded to
 * @returns HTML string for the webview
 */
function generateResponseWebviewHtml(query: string): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 10px; }
          .response { white-space: pre-wrap; }
          button { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 12px; cursor: pointer; margin: 8px 0; }
          .loading { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(0, 0, 0, 0.1); border-radius: 50%; border-top-color: var(--vscode-progressBar-background); animation: spin 1s ease-in-out infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <h2>@vscode response</h2>
        <div class="query">Query: ${query}</div>
        <div class="response">
          <div class="loading"></div> Generating response...
        </div>
        <div id="buttons" style="display: none;">
          <button id="copyBtn">Copy to Clipboard</button>
          <button id="executeBtn">Execute Command</button>
        </div>
        <script>
          const vscode = acquireVsCodeApi();
          
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
              document.querySelector('.response').innerHTML = message.content;
              if (message.isComplete) {
                document.getElementById('buttons').style.display = 'block';
              }
            }
          });
          
          document.getElementById('copyBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'copy' });
          });
          
          document.getElementById('executeBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'execute' });
          });
        </script>
      </body>
    </html>
  `;
}

/**
 * Extension activation - called when the extension is first loaded
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Activating Obsidian Magic VS Code Extension');

  // Initialize the vault integration service
  vaultService = new VaultIntegrationService(context);
  context.subscriptions.push(vaultService);

  // Initialize Language Model API (works in both VS Code and Cursor)
  languageModelAPI = new LanguageModelAPI(context);
  context.subscriptions.push(languageModelAPI);

  // Register Language Model Provider if API is available
  languageModelAPI.registerLanguageModelProvider();

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
      const vaults = vaultService?.getVaults() ?? [];
      statusBarItem.text =
        vaults.length > 0 ? `$(database) Obsidian Vaults (${String(vaults.length)})` : '$(database) Obsidian Vault';
    });
  }
}

/**
 * Activate Cursor-specific features including the MCP server
 */
function activateCursorFeatures(context: vscode.ExtensionContext): void {
  // Initialize the MCP server for Cursor integration
  mcpServer = new MCPServer(context);

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
  const cursorTagCommand = vscode.commands.registerCommand('obsidian-magic.cursorTagFile', () => {
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

    // Get document content
    const text = editor.document.getText();
    const fileName = editor.document.fileName;

    // Use Language Model API to analyze content and suggest tags
    const lmAPI = languageModelAPI;
    if (!lmAPI) {
      // Fallback to basic information message if Language Model API is not available
      vscode.window.showInformationMessage('Tagging current file with Cursor AI assistance');
      return;
    }

    // Show progress notification
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing document content...',
        cancellable: true,
      },
      async () => {
        try {
          // Check if language model API is available
          if (!languageModelAPI) {
            vscode.window.showErrorMessage('Language model API not available');
            return;
          }

          // Store a local reference
          const lmAPI = languageModelAPI;

          // Generate tag suggestions
          const prompt = `Analyze this document and suggest relevant tags for it:
Filename: ${fileName}
Content: ${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}

Provide a JSON array of suggested tags, with each tag having a name and description.`;

          const response = await lmAPI.generateCompletion(prompt, {
            systemPrompt:
              'You are a helpful tagging assistant. Generate concise, relevant tags based on document content.',
          });

          // Show suggestions in a quick pick
          vscode.window.showInformationMessage('Tag suggestions generated', 'View Suggestions').then((selection) => {
            if (selection === 'View Suggestions') {
              // In a real implementation, we would parse the JSON and show a proper UI
              // For now, just show the raw response
              const panel = vscode.window.createWebviewPanel(
                'tagSuggestions',
                'Tag Suggestions',
                vscode.ViewColumn.Beside,
                {}
              );

              panel.webview.html = `
                <html>
                  <head>
                    <style>
                      body { font-family: var(--vscode-font-family); padding: 10px; }
                      pre { background-color: var(--vscode-editor-background); padding: 10px; }
                    </style>
                  </head>
                  <body>
                    <h2>Tag Suggestions</h2>
                    <pre>${response}</pre>
                  </body>
                </html>
              `;
            }
          });
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error generating tag suggestions: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        return Promise.resolve();
      }
    );
  });

  // Command to manually register @vscode participant
  const registerVSCodeParticipantCommand = vscode.commands.registerCommand(
    'obsidian-magic.cursorRegisterVSCodeParticipant',
    async () => {
      if (!mcpServer) {
        const response = await vscode.window.showInformationMessage(
          'Cursor integration is not initialized. Would you like to initialize it?',
          'Yes',
          'No'
        );

        if (response === 'Yes') {
          mcpServer = new MCPServer(context);
          context.subscriptions.push(mcpServer);
          vscode.window.showInformationMessage('@vscode participant initialized successfully');
        }
        return;
      }

      vscode.window.showInformationMessage('@vscode participant is already registered');
    }
  );

  // Command to query the @vscode participant directly
  const queryVSCodeCommand = vscode.commands.registerCommand('obsidian-magic.queryVSCode', async () => {
    const lmAPI = languageModelAPI;
    if (!lmAPI) {
      vscode.window.showErrorMessage('Language Model API not initialized');
      return;
    }

    // Prompt for query
    const query = await vscode.window.showInputBox({
      prompt: 'Ask a question about VS Code',
      placeHolder: 'How do I enable autosave?',
    });

    if (!query) return;

    // Show progress indicator
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `@vscode: ${query}`,
        cancellable: true,
      },
      async () => {
        // Create output channel for response
        const outputChannel = vscode.window.createOutputChannel('@vscode Participant');
        outputChannel.show();
        outputChannel.appendLine(`Query: ${query}\n`);
        outputChannel.appendLine('Generating response...\n');

        // Create webview panel for formatted response
        const panel = vscode.window.createWebviewPanel(
          'vscodeResponse',
          `@vscode: ${query.substring(0, 30)}${query.length > 30 ? '...' : ''}`,
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          }
        );

        // Load initial HTML with skeleton for response
        panel.webview.html = generateResponseWebviewHtml(query);

        try {
          let fullResponse = '';

          await lmAPI.generateStreamingCompletion(
            query,
            (response) => {
              // Update both output channel and webview
              fullResponse = response.content;

              if (!response.isComplete) {
                outputChannel.clear();
                outputChannel.appendLine(`Query: ${query}\n`);
                outputChannel.appendLine(response.content);
              } else {
                outputChannel.clear();
                outputChannel.appendLine(`Query: ${query}\n`);
                outputChannel.appendLine(response.content);
                outputChannel.appendLine('\n\nResponse complete.');
              }

              // Update webview with markdown-formatted content
              panel.webview.postMessage({
                type: 'update',
                content: response.content,
                isComplete: response.isComplete,
              });
            },
            {
              systemPrompt: `You are the @vscode participant in Cursor/VS Code. 
You have expert knowledge about VS Code, its features, settings, and extensions.
Provide helpful, accurate, and concise responses to questions about VS Code.
If applicable, provide specific commands, keyboard shortcuts, or settings that can help the user.`,
            }
          );

          // Add event listener for webview messages
          panel.webview.onDidReceiveMessage((message: { type: string }) => {
            if (message.type === 'copy') {
              vscode.env.clipboard.writeText(fullResponse);
              vscode.window.showInformationMessage('Response copied to clipboard');
            } else if (message.type === 'execute') {
              // In a real implementation, we would parse the response for commands
              vscode.window.showInformationMessage('Command execution not implemented yet');
            }
          });
        } catch (error) {
          outputChannel.appendLine(`\nError: ${error instanceof Error ? error.message : String(error)}`);
          panel.webview.postMessage({
            type: 'update',
            content: `Error generating response: ${error instanceof Error ? error.message : String(error)}`,
            isComplete: true,
          });
        }

        return Promise.resolve();
      }
    );
  });

  context.subscriptions.push(cursorTagCommand, registerVSCodeParticipantCommand, queryVSCodeCommand);
}

/**
 * Register standard VS Code commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Register standard tag file command
  const tagCommand = vscode.commands.registerCommand('obsidian-magic.tagFile', () => {
    // Get active editor document
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active file to tag');
      return;
    }

    // Get document content
    const text = editor.document.getText();
    const fileName = editor.document.fileName;

    // Check if Language Model API is available
    const lmAPI = languageModelAPI;
    if (!lmAPI) {
      vscode.window.showErrorMessage('Language Model API is not available');
      return;
    }

    // Show progress notification
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing document content...',
        cancellable: true,
      },
      async (progress) => {
        progress.report({ message: 'Generating tag suggestions' });

        try {
          // Generate tag suggestions
          const prompt = `Analyze this document and suggest relevant tags for it:
Filename: ${fileName}
Content: ${text.substring(0, 2000)}${text.length > 2000 ? '...' : ''}

Provide a JSON array of suggested tags, with each tag having a 'name' and 'description' properties.`;

          const response = await lmAPI.generateCompletion(prompt, {
            systemPrompt:
              'You are a helpful tagging assistant. Generate concise, relevant tags based on document content. Return only valid JSON.',
          });

          // Try to parse the response as JSON
          try {
            // In case the AI wrapped the JSON in ```json or other markdown formatting
            const jsonMatch =
              /```(?:json)?\s*(\[[\s\S]*?\])\s*```/.exec(response) ?? /(\[[\s\S]*?\])/.exec(response) ?? null;

            let tags: { name: string; description: string }[] = [];

            if (jsonMatch?.[1]) {
              tags = JSON.parse(jsonMatch[1]) as { name: string; description: string }[];
            } else {
              // If we can't parse as JSON, show the raw response
              vscode.window.showWarningMessage('Could not parse tag suggestions as JSON');
              tags = [{ name: 'parsing-error', description: 'Could not parse AI response' }];
            }

            // Show tags in a quick pick for selection
            const tagOptions = tags.map((tag) => ({
              label: tag.name,
              description: tag.description,
              picked: true,
            }));

            const selectedTags = await vscode.window.showQuickPick(tagOptions, {
              canPickMany: true,
              placeHolder: 'Select tags to apply to document',
            });

            if (selectedTags && selectedTags.length > 0) {
              // Process selected tags
              const tagNames = selectedTags.map((tag) => tag.label);

              // If we have a vault service, try to save the tags information
              if (vaultService) {
                try {
                  // Use the vault service to apply tags to document
                  const success = await vaultService.applyTagsToDocument(fileName, tagNames);
                  if (success) {
                    vscode.window.showInformationMessage(`Applied tags: ${tagNames.join(', ')}`);
                  } else {
                    vscode.window.showWarningMessage('Could not apply tags - document may not be in an Obsidian vault');
                  }
                } catch (error) {
                  vscode.window.showErrorMessage(
                    `Error applying tags: ${error instanceof Error ? error.message : String(error)}`
                  );
                }
              } else {
                vscode.window.showInformationMessage(`Selected tags: ${tagNames.join(', ')}`);
              }
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Error processing tags: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error generating tag suggestions: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        return Promise.resolve();
      }
    );
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
      placeHolder: 'Select Vault Action',
    });

    if (choice === 'Add Vault') {
      // Just execute the command that's already registered in VaultIntegrationService
      await vscode.commands.executeCommand('obsidian-magic.addVault');
    } else if (choice === 'Remove Vault') {
      // Just execute the command that's already registered in VaultIntegrationService
      await vscode.commands.executeCommand('obsidian-magic.removeVault');
    } else if (choice === 'Sync Vaults') {
      // Just execute the command that's already registered in VaultIntegrationService
      await vscode.commands.executeCommand('obsidian-magic.syncVault');
    }
  });

  // Add Vault command
  const addVaultCommand = vscode.commands.registerCommand('obsidian-magic.addVault', async () => {
    // Prompt user to select a directory for the vault
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: 'Select Obsidian Vault',
    };

    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri.length > 0 && fileUri[0]) {
      try {
        if (!vaultService) {
          vscode.window.showErrorMessage('Vault service not initialized');
          return;
        }

        const fsPath = fileUri[0].fsPath;
        const addedVault = await vaultService.addVault(fsPath);
        if (addedVault) {
          vscode.window.showInformationMessage(`Vault added: ${path.basename(fsPath)}`);
        } else {
          vscode.window.showWarningMessage('Could not add vault. It may already be registered.');
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Error adding vault: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  // Remove Vault command
  const removeVaultCommand = vscode.commands.registerCommand('obsidian-magic.removeVault', async () => {
    if (!vaultService) {
      vscode.window.showErrorMessage('Vault service not initialized');
      return;
    }

    const vaults = vaultService.getVaults();
    if (vaults.length === 0) {
      vscode.window.showInformationMessage('No vaults registered');
      return;
    }

    // Prompt user to select a vault to remove
    const vaultOptions = vaults.map((vault) => ({
      label: vault.name || path.basename(vault.path),
      description: vault.path,
    }));

    const selectedVault = await vscode.window.showQuickPick(vaultOptions, {
      placeHolder: 'Select vault to remove',
    });

    if (selectedVault) {
      try {
        const removed = await vaultService.removeVault(selectedVault.description);
        if (removed) {
          vscode.window.showInformationMessage(`Vault removed: ${String(selectedVault.label)}`);
        } else {
          vscode.window.showWarningMessage('Could not remove vault');
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error removing vault: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  });

  // Sync Vault command
  const syncVaultCommand = vscode.commands.registerCommand('obsidian-magic.syncVault', async () => {
    if (!vaultService) {
      vscode.window.showErrorMessage('Vault service not initialized');
      return;
    }

    const vaults = vaultService.getVaults();
    if (vaults.length === 0) {
      vscode.window.showInformationMessage('No vaults registered');
      return;
    }

    // Prompt user to select a vault to sync
    const vaultOptions = vaults.map((vault) => ({
      label: vault.name || path.basename(vault.path),
      description: vault.path,
    }));

    // Add option to sync all vaults
    vaultOptions.unshift({
      label: 'All Vaults',
      description: 'Sync all registered vaults',
    });

    const selectedVault = await vscode.window.showQuickPick(vaultOptions, {
      placeHolder: 'Select vault to synchronize',
    });

    if (selectedVault) {
      // Show progress notification
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Synchronizing ${String(selectedVault.label === 'All Vaults' ? 'all vaults' : selectedVault.label)}...`,
          cancellable: true,
        },
        async (_, token) => {
          try {
            if (selectedVault.label === 'All Vaults') {
              if (!vaultService) {
                vscode.window.showErrorMessage('Vault service not initialized');
                return;
              }

              vaultService.syncAllVaults(token);
              vscode.window.showInformationMessage('All vaults synchronized');
            } else {
              if (!vaultService) {
                vscode.window.showErrorMessage('Vault service not initialized');
                return;
              }
              await vaultService.syncVault(selectedVault.description);
              vscode.window.showInformationMessage(`Vault synchronized: ${String(selectedVault.label)}`);
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Error synchronizing vault: ${error instanceof Error ? error.message : String(error)}`
            );
          }

          return Promise.resolve();
        }
      );
    }
  });

  context.subscriptions.push(
    tagCommand,
    explorerCommand,
    manageVaultsCommand,
    addVaultCommand,
    removeVaultCommand,
    syncVaultCommand
  );
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
  languageModelAPI = undefined;
}
