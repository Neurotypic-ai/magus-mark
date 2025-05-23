import * as vscode from 'vscode';

import type { SmartContextProvider } from '../services/SmartContextProvider';
import type { TaggedNote } from '../services/VaultIntegrationService';

interface SmartSuggestion {
  type: 'tag' | 'file' | 'snippet' | 'note';
  content: string;
  relevance: number;
  reasoning: string;
  metadata?: Record<string, unknown>;
}

interface WebviewMessage {
  command: string;
  suggestion?: SmartSuggestion;
  index?: number;
}

export class SmartSuggestionsView implements vscode.WebviewViewProvider {
  public static readonly viewType = 'magusSmartSuggestions';

  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;
  private _smartContextProvider: SmartContextProvider;
  private _currentSuggestions: SmartSuggestion[] = [];
  private _notes: TaggedNote[] = [];

  constructor(context: vscode.ExtensionContext, smartContextProvider: SmartContextProvider) {
    this._context = context;
    this._smartContextProvider = smartContextProvider;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        switch (message.command) {
          case 'applySuggestion':
            if (message.suggestion) {
              await this.applySuggestion(message.suggestion);
            }
            break;
          case 'dismissSuggestion':
            if (typeof message.index === 'number') {
              this.dismissSuggestion(message.index);
            }
            break;
          case 'refreshSuggestions':
            await this.refreshSuggestions();
            break;
          case 'ready':
            await this.loadInitialSuggestions();
            break;
        }
      },
      undefined,
      this._context.subscriptions
    );

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(
      () => {
        void this.refreshSuggestions();
      },
      undefined,
      this._context.subscriptions
    );

    // Listen for text selection changes
    vscode.window.onDidChangeTextEditorSelection(
      () => {
        // Debounce to avoid too frequent updates
        setTimeout(() => {
          void this.refreshSuggestions();
        }, 1000);
      },
      undefined,
      this._context.subscriptions
    );
  }

  public updateNotes(notes: TaggedNote[]): void {
    this._notes = notes;
    void this.refreshSuggestions();
  }

  private async loadInitialSuggestions(): Promise<void> {
    await this.refreshSuggestions();
  }

  private async refreshSuggestions(): Promise<void> {
    try {
      const result = await this._smartContextProvider.provideSmartSuggestions(this._notes);

      if (result.isOk()) {
        this._currentSuggestions = result.value;
        this.updateWebview();
      } else {
        vscode.window.showErrorMessage(`Failed to load smart suggestions: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
    }
  }

  private async applySuggestion(suggestion: SmartSuggestion): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      vscode.window.showWarningMessage('No active editor to apply suggestion');
      return;
    }

    try {
      switch (suggestion.type) {
        case 'tag':
          await this.applyTagSuggestion(suggestion, activeEditor);
          break;
        case 'file':
          await this.applyFileSuggestion(suggestion);
          break;
        case 'snippet':
          await this.applySnippetSuggestion(suggestion, activeEditor);
          break;
        case 'note':
          await this.applyNoteSuggestion(suggestion);
          break;
      }

      vscode.window.showInformationMessage(`Applied suggestion: ${suggestion.content}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to apply suggestion: ${error}`);
    }
  }

  private async applyTagSuggestion(suggestion: SmartSuggestion, editor: vscode.TextEditor): Promise<void> {
    const document = editor.document;
    const text = document.getText();

    // Look for existing frontmatter
    const frontmatterMatch = /^---\n([\s\S]*?)\n---/.exec(text);

    if (frontmatterMatch) {
      // Update existing frontmatter
      const frontmatter = frontmatterMatch[1];
      const tagsMatch = frontmatter.match(/^tags:\s*(\[.*?\]|\S.*?)$/m);

      if (tagsMatch) {
        // Add to existing tags
        let existingTags: string[];
        try {
          existingTags = JSON.parse(tagsMatch[1]);
        } catch {
          existingTags = tagsMatch[1].split(',').map((t) => t.trim());
        }

        if (!existingTags.includes(suggestion.content)) {
          existingTags.push(suggestion.content);
          const newTagsLine = `tags: ${JSON.stringify(existingTags)}`;
          const newText = text.replace(tagsMatch[0], newTagsLine);

          await this.replaceDocumentText(editor, newText);
        }
      } else {
        // Add tags line to existing frontmatter
        const newFrontmatter = `${frontmatter}\ntags: ["${suggestion.content}"]`;
        const newText = text.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---`);

        await this.replaceDocumentText(editor, newText);
      }
    } else {
      // Create new frontmatter
      const newFrontmatter = `---\ntags: ["${suggestion.content}"]\n---\n\n`;
      const newText = newFrontmatter + text;

      await this.replaceDocumentText(editor, newText);
    }
  }

  private async applyFileSuggestion(suggestion: SmartSuggestion): Promise<void> {
    const filePath = suggestion.metadata?.path as string;
    if (filePath) {
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
    }
  }

  private async applySnippetSuggestion(suggestion: SmartSuggestion, editor: vscode.TextEditor): Promise<void> {
    const selection = editor.selection;
    await editor.edit((editBuilder) => {
      if (selection.isEmpty) {
        editBuilder.insert(selection.active, suggestion.content);
      } else {
        editBuilder.replace(selection, suggestion.content);
      }
    });

    // Format the inserted code if possible
    await vscode.commands.executeCommand('editor.action.formatSelection');
  }

  private async applyNoteSuggestion(suggestion: SmartSuggestion): Promise<void> {
    // This could create a new note or navigate to a template
    const result = await vscode.window.showInputBox({
      prompt: `Create new note: ${suggestion.content}`,
      value: suggestion.content,
      placeHolder: 'Enter note title...',
    });

    if (result) {
      // Create a new markdown file in the workspace
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (workspaceFolder) {
        const fileName = `${result.replace(/[^a-zA-Z0-9-_]/g, '-')}.md`;
        const filePath = vscode.Uri.joinPath(workspaceFolder.uri, fileName);

        const initialContent = `# ${result}\n\n<!-- ${suggestion.reasoning} -->\n\n`;

        await vscode.workspace.fs.writeFile(filePath, Buffer.from(initialContent));
        await vscode.window.showTextDocument(filePath);
      }
    }
  }

  private async replaceDocumentText(editor: vscode.TextEditor, newText: string): Promise<void> {
    const document = editor.document;
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));

    await editor.edit((editBuilder) => {
      editBuilder.replace(fullRange, newText);
    });
  }

  private dismissSuggestion(index: number): void {
    if (index >= 0 && index < this._currentSuggestions.length) {
      this._currentSuggestions.splice(index, 1);
      this.updateWebview();
    }
  }

  private updateWebview(): void {
    if (!this._view) {
      return;
    }

    this._view.webview.postMessage({
      command: 'updateSuggestions',
      suggestions: this._currentSuggestions,
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Suggestions</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 8px;
            font-size: 13px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .title {
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .refresh-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }
        
        .refresh-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .suggestions-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .suggestion {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            transition: all 0.2s;
        }
        
        .suggestion:hover {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-list-hoverBackground);
        }
        
        .suggestion-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
        }
        
        .suggestion-content {
            font-weight: 500;
            margin-bottom: 4px;
            word-break: break-word;
        }
        
        .suggestion-type {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .suggestion-type.tag { background: var(--vscode-charts-blue); }
        .suggestion-type.file { background: var(--vscode-charts-green); }
        .suggestion-type.snippet { background: var(--vscode-charts-purple); }
        .suggestion-type.note { background: var(--vscode-charts-orange); }
        
        .suggestion-reasoning {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            line-height: 1.4;
        }
        
        .suggestion-actions {
            display: flex;
            gap: 6px;
        }
        
        .suggestion-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            flex: 1;
        }
        
        .suggestion-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .dismiss-btn {
            background: transparent;
            color: var(--vscode-descriptionForeground);
            border: 1px solid var(--vscode-panel-border);
        }
        
        .dismiss-btn:hover {
            background: var(--vscode-list-errorBackground);
            color: var(--vscode-errorForeground);
        }
        
        .relevance-bar {
            height: 3px;
            background: var(--vscode-panel-border);
            border-radius: 1px;
            margin-bottom: 8px;
            overflow: hidden;
        }
        
        .relevance-fill {
            height: 100%;
            background: var(--vscode-progressBar-background);
            border-radius: 1px;
            transition: width 0.3s ease;
        }
        
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 20px;
            font-style: italic;
        }
        
        .empty-icon {
            font-size: 24px;
            margin-bottom: 8px;
            opacity: 0.5;
        }
        
        .code-snippet {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
            padding: 8px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
            white-space: pre-wrap;
            margin: 4px 0;
            max-height: 150px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🧠 Smart Suggestions</div>
        <button class="refresh-btn" onclick="refreshSuggestions()">↻ Refresh</button>
    </div>
    
    <div id="suggestions" class="suggestions-container">
        <div class="empty-state">
            <div class="empty-icon">🤔</div>
            <div>Analyzing your context...</div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function refreshSuggestions() {
            vscode.postMessage({ command: 'refreshSuggestions' });
        }
        
        function applySuggestion(suggestion) {
            vscode.postMessage({ 
                command: 'applySuggestion', 
                suggestion: suggestion 
            });
        }
        
        function dismissSuggestion(index) {
            vscode.postMessage({ 
                command: 'dismissSuggestion', 
                index: index 
            });
        }
        
        function renderSuggestions(suggestions) {
            const container = document.getElementById('suggestions');
            
            if (!suggestions || suggestions.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">💡</div>
                        <div>No suggestions available</div>
                        <div style="font-size: 11px; margin-top: 4px;">
                            Try selecting some text or switching files
                        </div>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = suggestions.map((suggestion, index) => {
                const isSnippet = suggestion.type === 'snippet';
                const contentDisplay = isSnippet 
                    ? \`<div class="code-snippet">\${suggestion.content}</div>\`
                    : \`<div class="suggestion-content">\${suggestion.content}</div>\`;
                
                return \`
                    <div class="suggestion">
                        <div class="suggestion-header">
                            <span class="suggestion-type \${suggestion.type}">\${suggestion.type}</span>
                        </div>
                        <div class="relevance-bar">
                            <div class="relevance-fill" style="width: \${(suggestion.relevance * 100).toFixed(0)}%"></div>
                        </div>
                        \${contentDisplay}
                        <div class="suggestion-reasoning">\${suggestion.reasoning}</div>
                        <div class="suggestion-actions">
                            <button class="suggestion-btn" onclick="applySuggestion(\${JSON.stringify(suggestion).replace(/"/g, '&quot;')})">
                                Apply
                            </button>
                            <button class="suggestion-btn dismiss-btn" onclick="dismissSuggestion(\${index})">
                                Dismiss
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateSuggestions':
                    renderSuggestions(message.suggestions);
                    break;
            }
        });
        
        // Tell the extension we're ready
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
  }
}
