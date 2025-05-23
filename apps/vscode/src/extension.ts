import * as fs from 'fs/promises';
import * as path from 'path';

import * as vscode from 'vscode';

import { LanguageModelAPI } from './cursor/LanguageModelAPI';
import { MCPServer } from './cursor/MCPServer';
import { SmartContextProvider } from './services/SmartContextProvider';
import { VaultIntegrationService, type TaggedNote, type TagRelationship } from './services/VaultIntegrationService';
import { KnowledgeGraphView } from './views/KnowledgeGraph';
import { registerRecentActivity } from './views/RecentActivity';
import { SmartSuggestionsView } from './views/SmartSuggestions';
import { registerTagExplorer } from './views/TagExplorer';
import { registerVaultBrowser } from './views/VaultBrowser';

// Mock types for now - these would come from the actual core package
interface OpenAIService {
  generateCompletion(options: {
    prompt: string;
    maxTokens: number;
    temperature: number;
  }): Promise<{ isOk(): boolean; isErr(): boolean; value: string; error: Error }>;
}

interface TagEngine {
  suggestTags(): Promise<{ isOk(): boolean; isErr(): boolean; value: string[]; error: Error }>;
}

// Store service instances for access from commands
let mcpServer: MCPServer | undefined;
let vaultService: VaultIntegrationService | undefined;
let languageModelAPI: LanguageModelAPI | undefined;
let smartContextProvider: SmartContextProvider | undefined;
let knowledgeGraphView: KnowledgeGraphView | undefined;
let smartSuggestionsView: SmartSuggestionsView | undefined;

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
        <h2>@magus-mark response</h2>
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

// Utility to load prompt templates from the prompts folder
async function loadPromptTemplate(
  context: vscode.ExtensionContext,
  filename: string,
  variables: Record<string, string> = {}
): Promise<string> {
  const promptPath = path.join(context.extensionPath, 'prompts', filename);
  let template = await fs.readFile(promptPath, 'utf8');
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return template;
}

/**
 * Extension activation - called when the extension is first loaded
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Activating Magus Mark VS Code Extension');

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
  const config = vscode.workspace.getConfiguration('magusMark');
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
  statusBarItem.command = 'magus-mark.manageVaults';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);

  // Update status bar when vaults change
  if (vaultService) {
    vaultService.onVaultChanged(() => {
      const vaults = vaultService?.getVaults() ?? [];
      statusBarItem.text =
        vaults.length > 0 ? `$(database) Obsidian Vaults (${vaults.length.toString()})` : '$(database) Obsidian Vault';
    });
  }
}

/**
 * Activate Cursor-specific features including the MCP server
 */
function activateCursorFeatures(context: vscode.ExtensionContext): void {
  // Initialize the MCP server for Cursor integration with vault service
  mcpServer = new MCPServer(context, vaultService);

  // Store the server instance in the context for disposal on deactivation
  context.subscriptions.push(mcpServer);

  // Register Cursor-specific commands
  registerCursorCommands(context);

  // Create status bar item to show Cursor integration status
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(cursor) @magus-mark';
  statusBarItem.tooltip = '@magus-mark participant active';
  statusBarItem.command = 'magus-mark.cursorRegisterVSCodeParticipant';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);

  console.log('@magus-mark participant initialized in Cursor environment');
}

/**
 * Register Cursor-specific commands
 */
function registerCursorCommands(context: vscode.ExtensionContext): void {
  // Command to tag current file with Cursor AI assistance
  const cursorTagCommand = vscode.commands.registerCommand('magus-mark.cursorTagFile', () => {
    if (!mcpServer) {
      vscode.window.showErrorMessage('Cursor integration not initialized');
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active file to tag');
      return;
    }
    const text = editor.document.getText();
    const fileName = editor.document.fileName;
    const lmAPI = languageModelAPI;
    if (!lmAPI) {
      vscode.window.showInformationMessage('Tagging current file with Cursor AI assistance');
      return;
    }
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing document content...',
        cancellable: true,
      },
      async () => {
        try {
          if (!languageModelAPI) {
            vscode.window.showErrorMessage('Language model API not available');
            return;
          }
          const prompt = await loadPromptTemplate(context, 'vscode-tagging.txt', {
            fileName,
            content: `${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}`,
          });
          const systemPrompt = await loadPromptTemplate(context, 'vscode-tagging.txt', {}); // fallback, can be replaced with a dedicated system prompt if needed
          const response = await lmAPI.generateCompletion(prompt, {
            systemPrompt,
          });
          vscode.window.showInformationMessage('Tag suggestions generated', 'View Suggestions').then((selection) => {
            if (selection === 'View Suggestions') {
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

  // Command to manually register @magus-mark participant
  const registerVSCodeParticipantCommand = vscode.commands.registerCommand(
    'magus-mark.cursorRegisterVSCodeParticipant',
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
          vscode.window.showInformationMessage('@magus-mark participant initialized successfully');
        }
        return;
      }

      vscode.window.showInformationMessage('@magus-mark participant is already registered');
    }
  );

  // Command to query the @magus-mark participant directly
  const queryVSCodeCommand = vscode.commands.registerCommand('magus-mark.queryVSCode', async () => {
    const lmAPI = languageModelAPI;
    if (!lmAPI) {
      vscode.window.showErrorMessage('Language Model API not initialized');
      return;
    }
    const query = await vscode.window.showInputBox({
      prompt: 'Ask a question about VS Code',
      placeHolder: 'How do I enable autosave?',
    });
    if (!query) return;
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `@magus-mark: ${query}`,
        cancellable: true,
      },
      async () => {
        const outputChannel = vscode.window.createOutputChannel('@magus-mark Participant');
        outputChannel.show();
        outputChannel.appendLine(`Query: ${query}\n`);
        outputChannel.appendLine('Generating response...\n');
        const panel = vscode.window.createWebviewPanel(
          'vscodeResponse',
          `@magus-mark: ${query.substring(0, 30)}${query.length > 30 ? '...' : ''}`,
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          }
        );
        panel.webview.html = generateResponseWebviewHtml(query);
        try {
          let fullResponse = '';
          const systemPrompt = await loadPromptTemplate(context, 'vscode-participant.txt', {});
          await lmAPI.generateStreamingCompletion(
            query,
            (response) => {
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
              panel.webview.postMessage({
                type: 'update',
                content: response.content,
                isComplete: response.isComplete,
              });
            },
            {
              systemPrompt,
            }
          );
          panel.webview.onDidReceiveMessage((message: { type: string }) => {
            if (message.type === 'copy') {
              vscode.env.clipboard.writeText(fullResponse);
              vscode.window.showInformationMessage('Response copied to clipboard');
            } else if (message.type === 'execute') {
              vscode.window.showInformationMessage('Command execution not implemented yet');
            }
          });
        } catch (error) {
          vscode.window.showErrorMessage(
            `Error generating response: ${error instanceof Error ? error.message : String(error)}`
          );
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
  const tagCommand = vscode.commands.registerCommand('magus-mark.tagFile', () => {
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
                const result = await vaultService.applyTagsToDocument(fileName, tagNames);
                if (result.isOk() && result.getValue()) {
                  vscode.window.showInformationMessage(`Applied tags: ${tagNames.join(', ')}`);

                  // Track activity
                  await vscode.commands.executeCommand('magus-mark.addTagActivity', fileName, tagNames);
                } else if (result.isFail()) {
                  vscode.window.showErrorMessage(`Error applying tags: ${result.getError().message}`);
                } else {
                  vscode.window.showWarningMessage('Could not apply tags - document may not be in an Obsidian vault');
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
  const explorerCommand = vscode.commands.registerCommand('magus-mark.openTagExplorer', async () => {
    // Focus the tag explorer view
    await vscode.commands.executeCommand('magusMarkTagExplorer.focus');
    vscode.window.showInformationMessage('Tag Explorer opened');
  });

  // Register vault management command
  const manageVaultsCommand = vscode.commands.registerCommand('magus-mark.manageVaults', async () => {
    const options = ['Add Vault', 'Remove Vault', 'Sync Vaults'];
    const choice = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select Vault Action',
    });

    if (choice === 'Add Vault') {
      // Just execute the command that's already registered in VaultIntegrationService
      await vscode.commands.executeCommand('magus-mark.addVault');
    } else if (choice === 'Remove Vault') {
      // Just execute the command that's already registered in VaultIntegrationService
      await vscode.commands.executeCommand('magus-mark.removeVault');
    } else if (choice === 'Sync Vaults') {
      // Just execute the command that's already registered in VaultIntegrationService
      await vscode.commands.executeCommand('magus-mark.syncVault');
    }
  });

  // Add Vault command
  const addVaultCommand = vscode.commands.registerCommand('magus-mark.addVault', async () => {
    // Prompt user to select a directory for the vault
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: 'Select Obsidian Vault',
    };

    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri.length > 0 && fileUri[0]) {
      if (!vaultService) {
        vscode.window.showErrorMessage('Vault service not initialized');
        return;
      }

      const fsPath = fileUri[0].fsPath;
      const result = await vaultService.addVault(fsPath);

      if (result.isOk()) {
        if (result.getValue()) {
          vscode.window.showInformationMessage(`Vault added: ${path.basename(fsPath)}`);
        } else {
          vscode.window.showWarningMessage('Vault is already registered.');
        }
      } else {
        vscode.window.showErrorMessage(`Error adding vault: ${result.getError().message}`);
      }
    }
  });

  // Remove Vault command
  const removeVaultCommand = vscode.commands.registerCommand('magus-mark.removeVault', async () => {
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
      const result = await vaultService.removeVault(selectedVault.description);

      if (result.isOk()) {
        if (result.getValue()) {
          vscode.window.showInformationMessage(`Vault removed: ${selectedVault.label}`);
        } else {
          vscode.window.showWarningMessage('Vault not found');
        }
      } else {
        vscode.window.showErrorMessage(`Error removing vault: ${result.getError().message}`);
      }
    }
  });

  // Sync Vault command
  const syncVaultCommand = vscode.commands.registerCommand('magus-mark.syncVault', async () => {
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
          title: `Synchronizing ${selectedVault.label === 'All Vaults' ? 'all vaults' : selectedVault.label}...`,
          cancellable: true,
        },
        async (_, token) => {
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

            const result = await vaultService.syncVault(selectedVault.description);
            if (result.isOk()) {
              vscode.window.showInformationMessage(`Vault synchronized: ${selectedVault.label}`);
            } else {
              vscode.window.showErrorMessage(`Error synchronizing vault: ${result.getError().message}`);
            }
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

  // Register additional commands for new features
  const searchTagsCommand = vscode.commands.registerCommand('magus-mark.searchTags', async () => {
    // Show quick pick for tag search
    const searchQuery = await vscode.window.showInputBox({
      placeHolder: 'Search for tags...',
      prompt: 'Enter search query for tags',
    });

    if (searchQuery) {
      // TODO: Implement tag search functionality
      vscode.window.showInformationMessage(`Searching for tags: ${searchQuery}`);
    }
  });

  const openKnowledgeGraphCommand = vscode.commands.registerCommand('magus-mark.openKnowledgeGraph', () => {
    // TODO: Implement knowledge graph visualization
    vscode.window.showInformationMessage('Knowledge Graph visualization is planned for a future release');
  });

  const openTagDashboardCommand = vscode.commands.registerCommand('magus-mark.openTagDashboard', () => {
    // TODO: Implement tag dashboard
    vscode.window.showInformationMessage('Tag Dashboard is planned for a future release');
  });

  const taggedFilesListCommand = vscode.commands.registerCommand('magus-mark.taggedFilesList', () => {
    // TODO: Implement tagged files list
    vscode.window.showInformationMessage('Tagged files list is planned for a future release');
  });

  // Add new commands to subscriptions
  context.subscriptions.push(
    searchTagsCommand,
    openKnowledgeGraphCommand,
    openTagDashboardCommand,
    taggedFilesListCommand
  );
}

/**
 * Initialize core extension features
 */
function initializeExtension(context: vscode.ExtensionContext): void {
  // Initialize tag explorer view with vault service
  const tagExplorerView = registerTagExplorer(context, vaultService);
  context.subscriptions.push(tagExplorerView);

  // Initialize vault browser view
  const vaultBrowserView = registerVaultBrowser(context, vaultService);
  context.subscriptions.push(vaultBrowserView);

  // Initialize recent activity view
  const recentActivityView = registerRecentActivity(context, vaultService);
  context.subscriptions.push(recentActivityView);

  // Initialize advanced AI-powered features
  initializeAdvancedFeatures(context);

  // Set up any event listeners

  // Initialize any other extension features
}

/**
 * Initialize advanced AI-powered features
 */
function initializeAdvancedFeatures(context: vscode.ExtensionContext): void {
  try {
    // Create mock instances for now - in a real implementation these would come from the core package
    const mockOpenAIService: OpenAIService = {
      generateCompletion: async (options: { prompt: string; maxTokens: number; temperature: number }) => {
        // Mock implementation - in real code this would use the actual OpenAI service
        if (languageModelAPI) {
          const response = await languageModelAPI.generateCompletion(options.prompt, {
            temperature: options.temperature,
            maxTokens: options.maxTokens,
          });
          return { isOk: () => true, isErr: () => false, value: response, error: new Error('') };
        }
        return { isOk: () => false, isErr: () => true, value: '', error: new Error('Language model not available') };
      },
    } as OpenAIService;

    const mockTagEngine: TagEngine = {
      suggestTags: () => Promise.resolve({ isOk: () => true, isErr: () => false, value: [], error: new Error('') }),
    } as TagEngine;

    // Initialize Smart Context Provider
    smartContextProvider = new SmartContextProvider(mockOpenAIService, mockTagEngine);

    // Initialize Knowledge Graph View
    knowledgeGraphView = new KnowledgeGraphView(context);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(KnowledgeGraphView.viewType, knowledgeGraphView)
    );

    // Initialize Smart Suggestions View
    smartSuggestionsView = new SmartSuggestionsView(context, smartContextProvider);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(SmartSuggestionsView.viewType, smartSuggestionsView)
    );

    // Connect advanced services to MCP Server if it exists
    if (mcpServer) {
      mcpServer.setAdvancedServices(smartContextProvider, knowledgeGraphView);
    }

    // Set up data flow between services
    if (vaultService) {
      // Update views when vault data changes
      vaultService.onVaultChanged(() => {
        void (async () => {
          if (!vaultService) return;
          const notesResult = await vaultService.getAllNotes();
          if (notesResult.isOk()) {
            const notes: TaggedNote[] = notesResult.value;

            // Update knowledge graph
            const relationships = await vaultService.getTagRelationships();
            if (relationships.isOk() && knowledgeGraphView) {
              const relationshipData: TagRelationship[] = relationships.value;
              knowledgeGraphView.updateData(notes, relationshipData);
            }

            // Update smart suggestions
            if (smartSuggestionsView) {
              smartSuggestionsView.updateNotes(notes);
            }
          }
        })();
      });
    }

    // Register enhanced commands
    registerAdvancedCommands(context);

    console.log('Advanced AI features initialized successfully');
  } catch (error) {
    console.error('Failed to initialize advanced features:', error);
    vscode.window.showWarningMessage('Some advanced features could not be initialized');
  }
}

/**
 * Register commands for advanced features
 */
function registerAdvancedCommands(context: vscode.ExtensionContext): void {
  // Enhanced Knowledge Graph command
  const openKnowledgeGraphCommand = vscode.commands.registerCommand('magus-mark.openKnowledgeGraph', async () => {
    await vscode.commands.executeCommand('magusKnowledgeGraph.focus');
    vscode.window.showInformationMessage('Knowledge Graph opened - explore your content connections!');
  });

  // Smart Context Analysis command
  const analyzeContextCommand = vscode.commands.registerCommand('magus-mark.analyzeContext', async () => {
    if (!smartContextProvider || !vaultService) {
      vscode.window.showErrorMessage('Smart context analysis not available');
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing current context...',
        cancellable: false,
      },
      async () => {
        if (!vaultService || !smartContextProvider) return;
        const notesResult = await vaultService.getAllNotes();
        if (notesResult.isOk()) {
          const suggestions = await smartContextProvider.provideSmartSuggestions(notesResult.value, true);
          if (suggestions.isOk() && suggestions.value.length > 0) {
            await vscode.commands.executeCommand('magusSmartSuggestions.focus');
            vscode.window.showInformationMessage(`Found ${suggestions.value.length.toString()} smart suggestions!`);
          } else {
            vscode.window.showInformationMessage('No suggestions available for current context');
          }
        }
      }
    );
  });

  // Intelligent Tagging command (enhanced version of existing tag command)
  const intelligentTagCommand = vscode.commands.registerCommand('magus-mark.intelligentTag', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active file to tag');
      return;
    }

    if (!smartContextProvider) {
      // Fallback to regular tagging
      await vscode.commands.executeCommand('magus-mark.tagFile');
      return;
    }

    const content = editor.document.getText();
    const result = await smartContextProvider.getContextualTags(content);

    if (result.isOk() && result.value.length > 0) {
      const tagOptions = result.value.map((suggestion) => ({
        label: suggestion.tag,
        description: `Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`,
        detail: suggestion.reasoning,
        picked: suggestion.confidence > 0.7, // Auto-select high confidence tags
      }));

      const selectedTags = await vscode.window.showQuickPick(tagOptions, {
        canPickMany: true,
        placeHolder: 'Select AI-suggested tags to apply',
        title: 'Intelligent Tag Suggestions',
      });

      if (selectedTags && selectedTags.length > 0 && vaultService) {
        const tagNames = selectedTags.map((tag) => tag.label);
        const applyResult = await vaultService.applyTagsToDocument(editor.document.fileName, tagNames);

        if (applyResult.isOk()) {
          vscode.window.showInformationMessage(`Applied ${tagNames.length.toString()} intelligent tags!`);

          // Track activity
          smartContextProvider.trackFileActivity(editor.document.fileName, 'intelligent-tag');
        }
      }
    } else {
      vscode.window.showInformationMessage('No intelligent tag suggestions available');
    }
  });

  // Explore Related Files command
  const exploreRelatedCommand = vscode.commands.registerCommand('magus-mark.exploreRelated', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !smartContextProvider || !vaultService) {
      vscode.window.showErrorMessage('Related file exploration not available');
      return;
    }

    const notesResult = await vaultService.getAllNotes();
    if (notesResult.isErr()) {
      vscode.window.showErrorMessage('Could not load notes for analysis');
      return;
    }

    const relatedFiles = await smartContextProvider.suggestRelatedFiles(editor.document.fileName, notesResult.value);

    if (relatedFiles.length > 0) {
      const fileOptions = relatedFiles.map((filePath) => {
        const note = notesResult.value.find((n) => n.path === filePath);
        return {
          label: note?.title ?? path.basename(filePath),
          description: filePath,
          detail: `Tags: ${note?.tags.join(', ') ?? 'None'}`,
        };
      });

      const selectedFile = await vscode.window.showQuickPick(fileOptions, {
        placeHolder: 'Select a related file to open',
        title: 'Related Files',
      });

      if (selectedFile) {
        const uri = vscode.Uri.file(selectedFile.description);
        await vscode.window.showTextDocument(uri);
      }
    } else {
      vscode.window.showInformationMessage('No related files found');
    }
  });

  // Generate Code Snippet command
  const generateSnippetCommand = vscode.commands.registerCommand('magus-mark.generateSnippet', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !smartContextProvider) {
      vscode.window.showErrorMessage('Code snippet generation not available');
      return;
    }

    const description = await vscode.window.showInputBox({
      prompt: 'Describe the code you want to generate',
      placeHolder: 'e.g., "function to validate email addresses"',
    });

    if (!description) {
      return;
    }

    const language = editor.document.languageId;
    const context = editor.document.getText();

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating intelligent code snippet...',
        cancellable: false,
      },
      async () => {
        if (!smartContextProvider) return;
        const result = await smartContextProvider.provideIntelligentSnippets(context, language);

        if (result.isOk() && result.value.length > 0) {
          const snippetOptions = result.value.map((snippet) => ({
            label: (snippet.metadata?.description as string) || 'Generated Snippet',
            detail: snippet.reasoning,
            snippet: snippet.content,
          }));

          const selectedSnippet = await vscode.window.showQuickPick(snippetOptions, {
            placeHolder: 'Select a code snippet to insert',
            title: 'Generated Snippets',
          });

          if (selectedSnippet) {
            const selection = editor.selection;
            await editor.edit((editBuilder) => {
              if (selection.isEmpty) {
                editBuilder.insert(selection.active, selectedSnippet.snippet);
              } else {
                editBuilder.replace(selection, selectedSnippet.snippet);
              }
            });

            // Format the inserted code
            await vscode.commands.executeCommand('editor.action.formatSelection');
            vscode.window.showInformationMessage('Intelligent snippet inserted!');
          }
        } else {
          vscode.window.showInformationMessage('Could not generate snippets for current context');
        }
      }
    );
  });

  context.subscriptions.push(
    openKnowledgeGraphCommand,
    analyzeContextCommand,
    intelligentTagCommand,
    exploreRelatedCommand,
    generateSnippetCommand
  );
}

/**
 * Extension deactivation - called when the extension is unloaded
 */
export function deactivate(): void {
  console.log('Deactivating Magus Mark VS Code Extension');
  // Resources disposed automatically via context.subscriptions
  mcpServer = undefined;
  vaultService = undefined;
  languageModelAPI = undefined;
}
