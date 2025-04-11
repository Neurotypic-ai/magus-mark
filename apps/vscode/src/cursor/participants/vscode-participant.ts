import * as vscode from 'vscode';

/**
 * Custom Command interface to extend vscode.Command with additional properties
 */
interface ExtendedCommand extends vscode.Command {
  category?: string;
}

/**
 * Interface for VS Code settings query tool
 */
interface VSCodeSettingsTool {
  name: 'vscodeSettings';
  description: 'Search VS Code settings with natural language';
  parameters: {
    query: string;
  };
  execute: (params: { query: string }) => Promise<{
    settings: Array<{
      id: string;
      name: string;
      description: string;
      value: any;
      defaultValue: any;
      category: string;
    }>;
  }>;
}

/**
 * Interface for VS Code commands tool
 */
interface VSCodeCommandsTool {
  name: 'vscodeCommands';
  description: 'Search and execute VS Code commands with natural language';
  parameters: {
    query: string;
    execute?: boolean;
  };
  execute: (params: { query: string; execute?: boolean }) => Promise<{
    commands: Array<{
      id: string;
      title: string;
      category?: string | undefined;
      keybinding?: string | undefined;
    }>;
    executed?: string | undefined;
  }>;
}

/**
 * Interface for VS Code documentation tool
 */
interface VSCodeDocumentationTool {
  name: 'vscodeDocumentation';
  description: 'Search VS Code documentation with natural language';
  parameters: {
    query: string;
  };
  execute: (params: { query: string }) => Promise<{
    results: Array<{
      title: string;
      content: string;
      url: string;
      relevance: number;
    }>;
  }>;
}

/**
 * Type for all VS Code tools
 */
type VSCodeTool = VSCodeSettingsTool | VSCodeCommandsTool | VSCodeDocumentationTool;

/**
 * @vscode participant implementation for Obsidian Magic's Cursor integration
 * Based on VS Code's implementation mentioned in official blog posts
 */
export class VSCodeParticipant {
  private tools: VSCodeTool[] = [];
  private readonly settingsCache: Map<string, any> = new Map();
  private readonly commandsCache: Map<string, ExtendedCommand> = new Map();
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.initializeTools();
    this.cacheSettings();
    this.cacheCommands();
  }

  /**
   * Initialize all @vscode participant tools
   */
  private initializeTools(): void {
    this.tools = [
      this.createSettingsTool(),
      this.createCommandsTool(),
      this.createDocumentationTool()
    ];
  }

  /**
   * Create settings search tool
   */
  private createSettingsTool(): VSCodeSettingsTool {
    return {
      name: 'vscodeSettings',
      description: 'Search VS Code settings with natural language',
      parameters: {
        query: 'The natural language query to search settings'
      },
      execute: async (params) => {
        const query = params.query.toLowerCase();
        const configuration = vscode.workspace.getConfiguration();
        const results = [];

        // Search in cached settings
        for (const [id, metaData] of this.settingsCache.entries()) {
          const matchScore = this.calculateMatchScore(query, id, metaData);
          if (matchScore > 0.5) {
            const value = configuration.get(id);
            results.push({
              id,
              name: metaData.title || id,
              description: metaData.description || '',
              value,
              defaultValue: metaData.default,
              category: metaData.category || 'General',
              matchScore
            });
          }
        }

        // Sort by match score
        results.sort((a, b) => b.matchScore - a.matchScore);
        
        // Return top matches, removing the matchScore property
        return {
          settings: results.slice(0, 10).map(({ matchScore, ...rest }) => rest)
        };
      }
    };
  }

  /**
   * Create commands search and execution tool
   */
  private createCommandsTool(): VSCodeCommandsTool {
    return {
      name: 'vscodeCommands',
      description: 'Search and execute VS Code commands with natural language',
      parameters: {
        query: 'The natural language query to search commands',
        execute: false
      },
      execute: async (params) => {
        const query = params.query.toLowerCase();
        const shouldExecute = Boolean(params.execute) || false;
        const results = [];

        // Search in cached commands
        for (const [id, command] of this.commandsCache.entries()) {
          const matchScore = this.calculateMatchScore(query, id, {
            title: command.title,
            category: command.category
          });
          
          if (matchScore > 0.5) {
            results.push({
              id,
              title: command.title || id,
              category: command.category,
              keybinding: await this.getKeybindingForCommand(id),
              matchScore
            });
          }
        }

        // Sort by match score
        results.sort((a, b) => b.matchScore - a.matchScore);
        
        // Execute top command if requested
        let executed: string | undefined;
        if (shouldExecute && results.length > 0) {
          const topCommand = results[0];
          if (topCommand) {
            await vscode.commands.executeCommand(topCommand.id);
            executed = topCommand.id;
          }
        }
        
        // Return results, removing matchScore property and ensuring optional properties
        return {
          commands: results.slice(0, 10).map(({ matchScore, ...rest }) => rest),
          executed
        };
      }
    };
  }

  /**
   * Create documentation search tool
   */
  private createDocumentationTool(): VSCodeDocumentationTool {
    return {
      name: 'vscodeDocumentation',
      description: 'Search VS Code documentation with natural language',
      parameters: {
        query: 'The natural language query to search documentation'
      },
      execute: async (params) => {
        // This would normally use a vector DB or similar for semantic search
        // For now, we'll return some static results based on query keywords
        const query = params.query.toLowerCase();
        const results = [];
        
        // Mock documentation entries (in a real implementation, this would be from a database)
        const docs = [
          {
            title: 'Getting Started with VS Code',
            content: 'Learn how to install and set up Visual Studio Code for your development needs.',
            url: 'https://code.visualstudio.com/docs/introvideos/basics',
            keywords: ['install', 'setup', 'getting started', 'basics']
          },
          {
            title: 'Code Editing in VS Code',
            content: 'Learn about the rich editing features of Visual Studio Code.',
            url: 'https://code.visualstudio.com/docs/editor/codebasics',
            keywords: ['editing', 'code', 'navigation', 'search', 'replace']
          },
          {
            title: 'Debugging in VS Code',
            content: 'Learn how to debug your applications using VS Code\'s built-in debugger.',
            url: 'https://code.visualstudio.com/docs/editor/debugging',
            keywords: ['debug', 'breakpoint', 'step', 'watch', 'variables']
          },
          {
            title: 'Extension API',
            content: 'Learn how to create extensions for VS Code.',
            url: 'https://code.visualstudio.com/api',
            keywords: ['extension', 'api', 'plugin', 'development']
          }
        ];
        
        // Search through documentation
        for (const doc of docs) {
          const relevance = this.calculateDocRelevance(query, doc);
          if (relevance > 0.3) {
            results.push({
              title: doc.title,
              content: doc.content,
              url: doc.url,
              relevance
            });
          }
        }
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        return {
          results: results.slice(0, 5)
        };
      }
    };
  }

  /**
   * Cache all VS Code settings
   */
  private async cacheSettings(): Promise<void> {
    try {
      // In a real implementation, we would get these from the VS Code API
      // For now, we'll use a small set of common settings as an example
      const commonSettings = [
        {
          id: 'editor.fontSize',
          title: 'Editor Font Size',
          description: 'Controls the font size in pixels.',
          default: 14,
          category: 'Editor'
        },
        {
          id: 'editor.fontFamily',
          title: 'Editor Font Family',
          description: 'Controls the font family.',
          default: 'Consolas, \'Courier New\', monospace',
          category: 'Editor'
        },
        {
          id: 'workbench.colorTheme',
          title: 'Color Theme',
          description: 'Specifies the color theme used in the workbench.',
          default: 'Default Dark+',
          category: 'Workbench'
        },
        {
          id: 'workbench.activityBar.orientation',
          title: 'Activity Bar Orientation',
          description: 'Controls the orientation of the activity bar (vertical or horizontal).',
          default: 'vertical',
          category: 'Workbench'
        }
      ];
      
      // Cache settings
      for (const setting of commonSettings) {
        this.settingsCache.set(setting.id, setting);
      }
    } catch (error) {
      console.error('Failed to cache settings:', error);
    }
  }

  /**
   * Cache all VS Code commands
   */
  private async cacheCommands(): Promise<void> {
    try {
      // In a real implementation, we would get these from the VS Code API
      // For now, we'll use a small set of common commands as an example
      const commonCommands = [
        {
          command: 'workbench.action.openSettings',
          title: 'Open Settings',
          category: 'Preferences'
        },
        {
          command: 'workbench.action.openCommandPalette',
          title: 'Show Command Palette',
          category: 'View'
        },
        {
          command: 'editor.action.formatDocument',
          title: 'Format Document',
          category: 'Editor'
        },
        {
          command: 'workbench.action.toggleSidebarVisibility',
          title: 'Toggle Sidebar Visibility',
          category: 'View'
        }
      ];
      
      // Cache commands
      for (const command of commonCommands) {
        this.commandsCache.set(command.command, command as ExtendedCommand);
      }
    } catch (error) {
      console.error('Failed to cache commands:', error);
    }
  }

  /**
   * Get keybinding for a command
   */
  private async getKeybindingForCommand(commandId: string): Promise<string | undefined> {
    // In a real implementation, we would query VS Code API for keybindings
    // For now, we'll return some static bindings for common commands
    const commonKeybindings: Record<string, string> = {
      'workbench.action.openSettings': 'Ctrl+,',
      'workbench.action.openCommandPalette': 'Ctrl+Shift+P',
      'editor.action.formatDocument': 'Shift+Alt+F',
      'workbench.action.toggleSidebarVisibility': 'Ctrl+B'
    };
    
    return commonKeybindings[commandId];
  }

  /**
   * Calculate match score between query and setting/command
   */
  private calculateMatchScore(query: string, id: string, metadata: any): number {
    const idLower = id.toLowerCase();
    const titleLower = (metadata.title || '').toLowerCase();
    const descLower = (metadata.description || '').toLowerCase();
    const categoryLower = (metadata.category || '').toLowerCase();
    
    // Simple keyword matching (in a real implementation, use semantic similarity)
    let score = 0;
    
    // Check for exact matches
    if (idLower === query) score += 1;
    if (titleLower === query) score += 1;
    
    // Check for partial matches
    if (idLower.includes(query)) score += 0.7;
    if (titleLower.includes(query)) score += 0.8;
    if (descLower.includes(query)) score += 0.6;
    if (categoryLower.includes(query)) score += 0.5;
    
    // Check for word matches
    const queryWords = query.split(/\s+/);
    for (const word of queryWords) {
      if (word.length < 3) continue; // Skip short words
      
      if (idLower.includes(word)) score += 0.3;
      if (titleLower.includes(word)) score += 0.4;
      if (descLower.includes(word)) score += 0.3;
      if (categoryLower.includes(word)) score += 0.2;
    }
    
    return Math.min(score, 1); // Normalize to 0-1
  }

  /**
   * Calculate relevance score for documentation search
   */
  private calculateDocRelevance(query: string, doc: any): number {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const keywords = doc.keywords || [];
    
    // Simple keyword matching (in a real implementation, use semantic similarity)
    let score = 0;
    
    // Title and content matches
    if (titleLower.includes(query)) score += 0.8;
    if (contentLower.includes(query)) score += 0.6;
    
    // Keyword matches
    for (const keyword of keywords) {
      if (query.includes(keyword)) score += 0.5;
      if (keyword.includes(query)) score += 0.3;
    }
    
    // Word matches
    const queryWords = query.split(/\s+/);
    for (const word of queryWords) {
      if (word.length < 3) continue; // Skip short words
      
      if (titleLower.includes(word)) score += 0.4;
      if (contentLower.includes(word)) score += 0.3;
      
      for (const keyword of keywords) {
        if (keyword.includes(word)) score += 0.2;
      }
    }
    
    return Math.min(score, 1); // Normalize to 0-1
  }

  /**
   * Register the @vscode participant with the MCP server
   */
  public registerWithMCPServer(mcpServer: any): void {
    try {
      // Register each tool with the MCP server
      for (const tool of this.tools) {
        mcpServer.registerTool(tool.name, {
          description: tool.description,
          parameters: tool.parameters,
          execute: tool.execute
        });
      }
      
      console.log('@vscode participant registered with MCP server');
    } catch (error) {
      console.error('Failed to register @vscode participant:', error);
    }
  }

  /**
   * Dispose of resources when extension is deactivated
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.settingsCache.clear();
    this.commandsCache.clear();
  }
} 