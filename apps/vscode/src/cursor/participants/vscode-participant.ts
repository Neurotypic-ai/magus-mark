import * as vscode from 'vscode';

import type { Tool } from '../mcp-server';

/**
 * Interface for setting metadata
 */
interface SettingMetadata {
  id: string;
  title?: string;
  description?: string;
  default?: unknown;
  category?: string;
}

/**
 * Interface for documentation entry
 */
interface DocumentationEntry {
  title: string;
  content: string;
  url: string;
  keywords: string[];
}

// Type for metadata passed to calculateMatchScore
interface MetadataWithTitleCategory {
  title?: string | undefined;
  description?: string | undefined;
  category?: string | undefined;
}

// Storage keys
const STORAGE_KEYS = {
  SETTINGS_CACHE: 'vscodeParticipant.settingsCache',
  COMMANDS_CACHE: 'vscodeParticipant.commandsCache',
};

/**
 * @vscode participant implementation for Obsidian Magic's Cursor integration
 * Based on Cursor's Model Context Protocol specification
 */
export class VSCodeParticipant implements vscode.Disposable {
  private readonly tools = new Map<string, Tool>();
  private readonly settingsCache = new Map<string, SettingMetadata>();
  private readonly commandsCache = new Map<string, ExtendedCommand>();

  constructor(
    // Used for context storage and to register disposables
    private readonly context: vscode.ExtensionContext
  ) {
    this.registerTools();
    
    // Try to restore cached data from storage
    this.restoreCachedData();
    
    // Cache fresh data and store it
    void this.cacheSettings().then(() => { this.storeCachedData(); });
    void this.cacheCommands().then(() => { this.storeCachedData(); });
    
    // Register a disposable for the participant
    this.context.subscriptions.push(this);
  }

  /**
   * Store cached data in extension storage
   */
  private storeCachedData(): void {
    try {
      // Convert Map to serializable object
      const settingsObj = Object.fromEntries(this.settingsCache.entries());
      const commandsObj = Object.fromEntries(this.commandsCache.entries());
      
      // Store in global state (persists across sessions)
      this.context.globalState.update(STORAGE_KEYS.SETTINGS_CACHE, settingsObj);
      this.context.globalState.update(STORAGE_KEYS.COMMANDS_CACHE, commandsObj);
    } catch (error) {
      console.error('Failed to store cached data:', error);
    }
  }

  /**
   * Restore cached data from extension storage
   */
  private restoreCachedData(): void {
    try {
      // Get stored data
      const storedSettings = this.context.globalState.get<Record<string, SettingMetadata>>(STORAGE_KEYS.SETTINGS_CACHE);
      const storedCommands = this.context.globalState.get<Record<string, ExtendedCommand>>(STORAGE_KEYS.COMMANDS_CACHE);
      
      // Restore settings cache
      if (storedSettings) {
        Object.entries(storedSettings).forEach(([key, value]) => {
          this.settingsCache.set(key, value);
        });
      }
      
      // Restore commands cache
      if (storedCommands) {
        Object.entries(storedCommands).forEach(([key, value]) => {
          this.commandsCache.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to restore cached data:', error);
    }
  }

  /**
   * Register all tools with the internal tools map
   */
  private registerTools(): void {
    this.tools.set('vscodeSettings', this.createSettingsTool());
    this.tools.set('vscodeCommands', this.createCommandsTool());
    this.tools.set('vscodeDocumentation', this.createDocumentationTool());
  }

  /**
   * Create settings search tool
   */
  private createSettingsTool(): Tool {
    return {
      name: 'vscodeSettings',
      description: 'Search VS Code settings with natural language',
      parameters: {
        query: {
          description: 'The natural language query to search settings',
          type: 'string',
          required: true,
        },
      },
      execute: (params: Record<string, unknown>) => {
        const query = (params['query'] as string).toLowerCase();
        const configuration = vscode.workspace.getConfiguration();
        const results: {
          id: string;
          name: string;
          description: string;
          value: unknown;
          defaultValue: unknown;
          category: string;
          matchScore: number;
        }[] = [];

        // Search in cached settings
        for (const [id, metaData] of this.settingsCache.entries()) {
          const matchScore = this.calculateMatchScore(query, id, metaData);
          if (matchScore > 0.5) {
            const value = configuration.get(id);
            results.push({
              id,
              name: metaData.title ?? id,
              description: metaData.description ?? '',
              value,
              defaultValue: metaData.default,
              category: metaData.category ?? 'General',
              matchScore,
            });
          }
        }

        // Sort by match score
        results.sort((a, b) => b.matchScore - a.matchScore);

        // Return top matches, removing the matchScore property (used only for sorting)
        return Promise.resolve({
          settings: results.slice(0, 10).map(item => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { matchScore, ...rest } = item;
            return rest;
          }),
        });
      },
    };
  }

  /**
   * Create commands search and execution tool
   */
  private createCommandsTool(): Tool {
    return {
      name: 'vscodeCommands',
      description: 'Search and execute VS Code commands with natural language',
      parameters: {
        query: {
          description: 'The natural language query to search commands',
          type: 'string',
          required: true,
        },
        execute: {
          description: 'Whether to execute the top matching command (true/false)',
          type: 'boolean',
          required: false,
        },
      },
      execute: async (params: Record<string, unknown>) => {
        const query = (params['query'] as string).toLowerCase();
        const shouldExecute = params['execute'] === true;
        const results: {
          id: string;
          title: string;
          category?: string | undefined;
          keybinding?: string | undefined;
          matchScore: number;
        }[] = [];

        // Search in cached commands
        for (const [id, command] of this.commandsCache.entries()) {
          const matchScore = this.calculateMatchScore(query, id, {
            title: command.title,
            category: command.category,
          });

          if (matchScore > 0.5) {
            results.push({
              id,
              title: command.title || id,
              category: command.category,
              keybinding: await this.getKeybindingForCommand(id),
              matchScore,
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

        // Return results, removing matchScore property (used only for sorting)
        return {
          commands: results.slice(0, 10).map(item => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { matchScore, ...rest } = item;
            return rest;
          }),
          executed,
        };
      },
    };
  }

  /**
   * Create documentation search tool
   */
  private createDocumentationTool(): Tool {
    return {
      name: 'vscodeDocumentation',
      description: 'Search VS Code documentation with natural language',
      parameters: {
        query: {
          description: 'The natural language query to search documentation',
          type: 'string',
          required: true,
        },
      },
      execute: (params: Record<string, unknown>) => {
        // This would normally use a vector DB or similar for semantic search
        // For now, we'll return some static results based on query keywords
        const query = (params['query'] as string).toLowerCase();
        const results: {
          title: string;
          content: string;
          url: string;
          relevance: number;
        }[] = [];

        // Mock documentation entries (in a real implementation, this would be from a database)
        const docs: DocumentationEntry[] = [
          {
            title: 'Getting Started with VS Code',
            content: 'Learn how to install and set up Visual Studio Code for your development needs.',
            url: 'https://code.visualstudio.com/docs/introvideos/basics',
            keywords: ['install', 'setup', 'getting started', 'basics'],
          },
          {
            title: 'Code Editing in VS Code',
            content: 'Learn about the rich editing features of Visual Studio Code.',
            url: 'https://code.visualstudio.com/docs/editor/codebasics',
            keywords: ['editing', 'code', 'navigation', 'search', 'replace'],
          },
          {
            title: 'Debugging in VS Code',
            content: "Learn how to debug your applications using VS Code's built-in debugger.",
            url: 'https://code.visualstudio.com/docs/editor/debugging',
            keywords: ['debug', 'breakpoint', 'step', 'watch', 'variables'],
          },
          {
            title: 'Extension API',
            content: 'Learn how to create extensions for VS Code.',
            url: 'https://code.visualstudio.com/api',
            keywords: ['extension', 'api', 'plugin', 'development'],
          },
        ];

        // Search through documentation
        for (const doc of docs) {
          const relevance = this.calculateDocRelevance(query, doc);
          if (relevance > 0.3) {
            results.push({
              title: doc.title,
              content: doc.content,
              url: doc.url,
              relevance,
            });
          }
        }

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        return Promise.resolve({
          results: results.slice(0, 5),
        });
      },
    };
  }

  /**
   * Cache all VS Code settings
   */
  private cacheSettings(): Promise<void> {
    try {
      // In a real implementation, we would get these from the VS Code API
      // For now, we'll use a small set of common settings as an example
      const commonSettings: SettingMetadata[] = [
        {
          id: 'editor.fontSize',
          title: 'Editor Font Size',
          description: 'Controls the font size in pixels.',
          default: 14,
          category: 'Editor',
        },
        {
          id: 'editor.fontFamily',
          title: 'Editor Font Family',
          description: 'Controls the font family.',
          default: "Consolas, 'Courier New', monospace",
          category: 'Editor',
        },
        {
          id: 'workbench.colorTheme',
          title: 'Color Theme',
          description: 'Specifies the color theme used in the workbench.',
          default: 'Default Dark+',
          category: 'Workbench',
        },
        {
          id: 'workbench.activityBar.location',
          title: 'Activity Bar Location',
          description: 'Controls the location of the activity bar (left, right, or hidden).',
          default: 'left',
          category: 'Workbench',
        },
      ];

      // Cache settings
      for (const setting of commonSettings) {
        this.settingsCache.set(setting.id, setting);
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to cache settings:', error);
      return Promise.reject(new Error(error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Cache all VS Code commands
   */
  private cacheCommands(): Promise<void> {
    try {
      // In a real implementation, we would get these from the VS Code API
      // using vscode.commands.getCommands() and then getting details
      const commonCommands = [
        {
          command: 'workbench.action.openSettings',
          title: 'Open Settings',
          category: 'Preferences',
        },
        {
          command: 'workbench.action.openCommandPalette',
          title: 'Show Command Palette',
          category: 'View',
        },
        {
          command: 'editor.action.formatDocument',
          title: 'Format Document',
          category: 'Editor',
        },
        {
          command: 'workbench.action.toggleSidebarVisibility',
          title: 'Toggle Sidebar Visibility',
          category: 'View',
        },
      ];

      // Cache commands
      for (const command of commonCommands) {
        this.commandsCache.set(command.command, command as ExtendedCommand);
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to cache commands:', error);
      return Promise.reject(new Error(error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Get keybinding for a command
   */
  private getKeybindingForCommand(commandId: string): Promise<string | undefined> {
    // In a real implementation, we would query VS Code API for keybindings
    // For now, we'll return some static bindings for common commands
    const commonKeybindings: Record<string, string> = {
      'workbench.action.openSettings': 'Ctrl+,',
      'workbench.action.openCommandPalette': 'Ctrl+Shift+P',
      'editor.action.formatDocument': 'Shift+Alt+F',
      'workbench.action.toggleSidebarVisibility': 'Ctrl+B',
    };

    return Promise.resolve(commonKeybindings[commandId]);
  }

  /**
   * Calculate match score between query and setting/command
   */
  private calculateMatchScore(query: string, id: string, metadata: MetadataWithTitleCategory): number {
    const idLower = id.toLowerCase();
    const titleLower = (metadata.title ?? '').toLowerCase();
    const descLower = (metadata.description ?? '').toLowerCase();
    const categoryLower = (metadata.category ?? '').toLowerCase();

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
  private calculateDocRelevance(query: string, doc: DocumentationEntry): number {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const keywords = doc.keywords;

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
  public registerWithMCPServer(mcpServer: { registerTool: (name: string, tool: Tool) => void }): void {
    try {
      // Register each tool with the MCP server
      for (const [name, tool] of this.tools.entries()) {
        mcpServer.registerTool(name, tool);
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
    // Store cached data before disposal
    this.storeCachedData();
    
    // Nothing else to dispose as all disposables are handled by context.subscriptions
  }
}

/**
 * Extended command interface with category
 */
interface ExtendedCommand extends vscode.Command {
  category?: string;
}
