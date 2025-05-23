import * as http from 'http';

import * as vscode from 'vscode';
import { WebSocketServer } from 'ws';

import { ValidationError } from '@magus-mark/core/errors/ValidationError';
import { toAppError } from '@magus-mark/core/errors/utils';

import { LanguageModelAPI } from './LanguageModelAPI';
import { VSCodeParticipant } from './participants/VSCodeParticipants';

import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';

import type { VaultIntegrationService } from '../services/VaultIntegrationService';

/**
 * Type for tool parameter definitions
 */
interface ToolParameterDefinition {
  description: string;
  required?: boolean;
  type?: string;
}

/**
 * Type for tool parameter values during execution
 */
interface ToolParameters {
  [key: string]: unknown;
  content?: string;
  options?: Record<string, unknown>;
  query?: string;
  name?: string;
  description?: string;
  category?: string;
  path?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  sessionId?: string;
  context?: Record<string, unknown>;
  depth?: number;
}

/**
 * Interface for tool registration
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameterDefinition>;
  execute: (params: ToolParameters) => Promise<unknown>;
}

/**
 * Type for incoming MCP messages
 */
interface MCPMessage {
  type: string;
  id?: string;
  toolName?: string;
  parameters?: ToolParameters;
}

/**
 * Type for the JSON result of tag analysis
 */
interface TagSuggestion {
  name: string;
  description: string;
}

/**
 * Model Context Protocol Server implementation
 * Enables VS Code extension to participate in Cursor AI conversations via the @magus-mark participant
 */
export class MCPServer implements vscode.Disposable {
  private httpServer: http.Server;
  private wsServer: WebSocketServer;
  private connections: WebSocket[] = [];
  private tools = new Map<string, Tool>();
  private participant: VSCodeParticipant | undefined;
  private languageModelAPI: LanguageModelAPI | undefined;
  private vaultService: VaultIntegrationService | undefined;
  private disposables: vscode.Disposable[] = [];
  private port: number;

  constructor(context: vscode.ExtensionContext, vaultService?: VaultIntegrationService) {
    // Get configured port from settings
    const config = vscode.workspace.getConfiguration('obsidianMagic');
    this.port = config.get<number>('cursorFeatures.mcpServerPort', 9876);

    // Store vault service for tool implementations
    this.vaultService = vaultService;

    // Initialize HTTP server
    this.httpServer = http.createServer((request, response) => {
      console.log('Request received:', request.url);

      response.writeHead(404);
      response.end();
    });

    // Initialize WebSocket server
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      clientTracking: true,
    });

    // Set up event handlers
    this.setupEventHandlers();

    // Start server
    this.start();

    // Initialize Language Model API
    this.languageModelAPI = new LanguageModelAPI(context);
    this.disposables.push(this.languageModelAPI);

    // Initialize and register VS Code participant
    this.initializeParticipant(context);

    // Register custom AI-powered tools
    this.registerCustomTools();
  }

  /**
   * Set up WebSocket server event handlers
   */
  private setupEventHandlers(): void {
    this.wsServer.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      try {
        this.connections.push(ws);

        const remoteAddress = request.socket.remoteAddress ?? 'unknown';
        console.log('WebSocket connection accepted from:', remoteAddress);

        // Handle incoming messages
        ws.on('message', (data: Buffer | string) => {
          try {
            const message = data.toString();
            this.handleUtf8Message(ws, message);
          } catch (error) {
            console.warn('Error processing message:', error);
          }
        });

        // Handle connection close
        ws.on('close', (code: number, reason: Buffer) => {
          console.log(`WebSocket connection closed: ${code.toString()} - ${reason.toString()}`);
          this.connections = this.connections.filter((conn) => conn !== ws);
        });

        // Handle errors
        ws.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
        });
      } catch (error) {
        console.error(
          'Error handling WebSocket connection:',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });
  }

  /**
   * Start the MCP server
   */
  private start(): void {
    try {
      this.httpServer.listen(this.port, () => {
        console.log(`MCP Server started on port ${this.port.toString()}`);

        // Create status bar item to indicate server is running
        const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBar.text = `$(globe) MCP:${this.port.toString()}`;
        statusBar.tooltip = `Model Context Protocol server running on port ${this.port.toString()}`;
        statusBar.show();

        this.disposables.push(statusBar);
      });
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      vscode.window.showErrorMessage(
        `Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Initialize the VS Code participant
   */
  private initializeParticipant(context: vscode.ExtensionContext): void {
    try {
      this.participant = new VSCodeParticipant(context);
      this.participant.registerWithMCPServer(this);

      // Add participant to disposables
      this.disposables.push(this.participant);

      console.log('VS Code participant registered with MCP server');
    } catch (error) {
      console.error('Failed to initialize VS Code participant:', error);
    }
  }

  /**
   * Register custom AI-powered tools
   */
  private registerCustomTools(): void {
    // Register the tagContent tool
    this.registerTool('tagContent', {
      name: 'tagContent',
      description: 'Analyze content and suggest tags',
      parameters: {
        content: { description: 'Content to analyze', required: true, type: 'string' },
        options: { description: 'Optional settings for tag generation', required: false, type: 'object' },
      },
      execute: async (params: ToolParameters) => {
        if (!this.languageModelAPI) {
          throw new Error('Language Model API not initialized');
        }

        // Validate required parameters
        if (!params.content) {
          throw new Error('Content parameter is required');
        }

        // Generate tag suggestions for content
        const prompt = `Analyze this content and suggest relevant tags for it:
Content: ${params.content.substring(0, 1000)}${params.content.length > 1000 ? '...' : ''}

Provide a JSON array of suggested tags, with each tag having a name and description.`;

        const response = await this.languageModelAPI.generateCompletion(prompt, {
          systemPrompt:
            'You are a helpful tagging assistant. Generate concise, relevant tags based on document content.',
        });

        // Extract JSON from message
        const jsonMatch =
          /```json\s*([\s\S]*?)\s*```/.exec(response) ??
          /```([\s\S]*?)```/.exec(response) ??
          /{[\s\S]*?}/.exec(response);

        if (jsonMatch?.[1]) {
          return JSON.parse(jsonMatch[1]) as TagSuggestion[];
        } else if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as TagSuggestion[];
        }

        // If we can't parse JSON, return null
        return null;
      },
    });

    // Register tag management tools with actual implementation
    this.registerTool('tagCreate', {
      name: 'tagCreate',
      description: 'Create new tags with metadata',
      parameters: {
        name: { description: 'Tag name', required: true, type: 'string' },
        description: { description: 'Tag description', required: false, type: 'string' },
        category: { description: 'Tag category', required: false, type: 'string' },
      },
      execute: (params: ToolParameters): Promise<unknown> => {
        if (!params.name || typeof params.name !== 'string') {
          throw new ValidationError('Tag name is required and must be a string');
        }

        // For now, return success with the tag info
        // TODO: Integrate with actual tag management system
        return Promise.resolve({
          status: 'success',
          message: `Tag '${params.name}' created successfully`,
          tag: {
            name: params.name,
            description: params.description ?? '',
            category: params.category ?? 'general',
          },
        });
      },
    });

    this.registerTool('tagSearch', {
      name: 'tagSearch',
      description: 'Search for tags matching criteria',
      parameters: {
        query: { description: 'Search query string', required: true, type: 'string' },
        limit: { description: 'Maximum number of results', required: false, type: 'number' },
        offset: { description: 'Offset for pagination', required: false, type: 'number' },
      },
      execute: (params: ToolParameters): Promise<unknown> => {
        if (!params.query || typeof params.query !== 'string') {
          throw new ValidationError('Query parameter is required and must be a string');
        }

        const query = params.query; // Store validated query
        const limit = typeof params.limit === 'number' ? params.limit : 10;
        const offset = typeof params.offset === 'number' ? params.offset : 0;

        // TODO: Implement actual tag search with core tagging system
        // For now, return mock results based on query
        const mockTags = [
          { name: 'programming', description: 'Programming related content' },
          { name: 'typescript', description: 'TypeScript programming language' },
          { name: 'vscode', description: 'Visual Studio Code editor' },
          { name: 'documentation', description: 'Documentation and guides' },
        ].filter(
          (tag) =>
            tag.name.toLowerCase().includes(query.toLowerCase()) ||
            tag.description.toLowerCase().includes(query.toLowerCase())
        );

        return Promise.resolve({
          status: 'success',
          results: mockTags.slice(offset, offset + limit),
          total: mockTags.length,
          query,
          limit,
          offset,
        });
      },
    });

    this.registerTool('notesList', {
      name: 'notesList',
      description: 'List notes matching criteria',
      parameters: {
        tags: { description: 'Filter by tags', required: false, type: 'array' },
        limit: { description: 'Maximum number of results', required: false, type: 'number' },
      },
      execute: (params: ToolParameters): Promise<unknown> => {
        const limit = typeof params.limit === 'number' ? params.limit : 10;
        const tags = Array.isArray(params.tags) ? params.tags : [];

        if (!this.vaultService) {
          return Promise.resolve({
            status: 'error',
            message: 'Vault service not available',
            notes: [],
            total: 0,
          });
        }

        const vaults = this.vaultService.getVaults();
        const notes: { path: string; name: string; vault: string }[] = [];

        for (const vault of vaults) {
          try {
            // TODO: Implement actual file scanning and tag filtering
            // For now, return basic vault info
            notes.push({
              path: vault.path,
              name: vault.name,
              vault: vault.name,
            });
          } catch (error) {
            console.warn(`Error listing notes from vault ${vault.name}:`, error);
          }
        }

        return Promise.resolve({
          status: 'success',
          notes: notes.slice(0, limit),
          total: notes.length,
          filters: { tags },
          limit,
        });
      },
    });

    this.registerTool('noteGet', {
      name: 'noteGet',
      description: 'Retrieve note content',
      parameters: {
        path: { description: 'Note file path', required: true, type: 'string' },
      },
      execute: async (params: ToolParameters) => {
        if (!params.path || typeof params.path !== 'string') {
          throw new ValidationError('Path parameter is required and must be a string');
        }

        try {
          // Try to read the file
          const fs = await import('fs/promises');
          const content = await fs.readFile(params.path, 'utf-8');

          // Parse frontmatter tags if present
          const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
          const match = frontmatterRegex.exec(content);

          let tags: string[] = [];
          let body = content;

          if (match) {
            const frontmatter = match[1] ?? '';
            body = match[2] ?? '';

            // Extract tags from frontmatter
            const tagMatch = /tags:\s*\[(.*?)\]/s.exec(frontmatter);
            if (tagMatch?.[1]) {
              tags = tagMatch[1]
                .split(',')
                .map((tag) => tag.trim().replace(/['"]/g, ''))
                .filter((tag) => tag.length > 0);
            }
          }

          return {
            status: 'success',
            note: {
              path: params.path,
              content: body,
              tags,
              metadata: {
                size: content.length,
                lastModified: new Date().toISOString(),
              },
            },
          };
        } catch (error) {
          const appError = toAppError(error, 'NOTE_READ_ERROR');
          return {
            status: 'error',
            message: `Failed to read note: ${appError.message}`,
            note: null,
          };
        }
      },
    });

    this.registerTool('graphQuery', {
      name: 'graphQuery',
      description: 'Query the knowledge graph',
      parameters: {
        query: { description: 'Graph query', required: true, type: 'string' },
        depth: { description: 'Maximum depth to traverse', required: false, type: 'number' },
      },
      execute: (params: ToolParameters): Promise<unknown> => {
        if (!params.query || typeof params.query !== 'string') {
          throw new ValidationError('Query parameter is required and must be a string');
        }

        const depth = typeof params.depth === 'number' ? params.depth : 2;

        // TODO: Implement actual knowledge graph functionality
        // For now, return mock graph data
        return Promise.resolve({
          status: 'success',
          nodes: [
            { id: 'node1', label: params.query, type: 'query' },
            { id: 'node2', label: 'related-concept', type: 'concept' },
          ],
          edges: [{ from: 'node1', to: 'node2', relationship: 'related-to' }],
          query: params.query,
          depth,
        });
      },
    });

    this.registerTool('contextProvide', {
      name: 'contextProvide',
      description: 'Provide context for current session',
      parameters: {
        sessionId: { description: 'Session identifier', required: true, type: 'string' },
        context: { description: 'Context data', required: true, type: 'object' },
      },
      execute: (params: ToolParameters): Promise<unknown> => {
        if (!params.sessionId || typeof params.sessionId !== 'string') {
          throw new ValidationError('Session ID is required and must be a string');
        }

        if (!params.context || typeof params.context !== 'object') {
          throw new ValidationError('Context is required and must be an object');
        }

        // TODO: Implement actual context management
        // For now, just acknowledge the context
        return Promise.resolve({
          status: 'success',
          message: 'Context provided successfully',
          sessionId: params.sessionId,
          contextKeys: Object.keys(params.context),
        });
      },
    });

    // Register the askVSCode tool
    this.registerTool('askVSCode', {
      name: 'askVSCode',
      description: 'Ask a question about VS Code',
      parameters: {
        query: { description: 'Question about VS Code', required: true, type: 'string' },
      },
      execute: async (params: ToolParameters) => {
        if (!this.languageModelAPI) {
          throw new Error('Language Model API not initialized');
        }

        // Validate required parameters
        if (!params.query) {
          throw new Error('Query parameter is required');
        }

        // Generate response to VS Code question
        const response = await this.languageModelAPI.generateCompletion(params.query, {
          systemPrompt: `You are the @magus-mark participant in Cursor/VS Code. 
You have expert knowledge about VS Code, its features, settings, and extensions.
Provide helpful, accurate, and concise responses to questions about VS Code.
If applicable, provide specific commands, keyboard shortcuts, or settings that can help the user.`,
        });

        return response;
      },
    });
  }

  /**
   * Handle UTF-8 message
   */
  private handleUtf8Message(ws: WebSocket, message: string): void {
    try {
      const data = JSON.parse(message) as MCPMessage;

      if (data.type === 'invoke') {
        void this.handleToolInvocation(ws, data);
      } else if (data.type === 'list_tools') {
        this.handleListTools(ws);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      this.sendErrorResponse(ws, 'Failed to parse message');
    }
  }

  /**
   * Handle tool invocation request
   */
  private async handleToolInvocation(ws: WebSocket, data: MCPMessage): Promise<void> {
    const toolName = data.toolName;
    const parameters = data.parameters;

    if (!toolName) {
      this.sendErrorResponse(ws, 'Tool name is required', data.id);
      return;
    }

    const tool = this.tools.get(toolName);

    if (!tool) {
      this.sendErrorResponse(ws, `Tool not found: ${toolName}`, data.id);
      return;
    }

    try {
      // Execute the tool
      const result = await tool.execute(parameters ?? {});

      // Send response
      ws.send(
        JSON.stringify({
          type: 'result',
          id: data.id,
          result,
        })
      );
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      this.sendErrorResponse(
        ws,
        `Error executing tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
        data.id
      );
    }
  }

  /**
   * Handle list tools request
   */
  private handleListTools(ws: WebSocket): void {
    const tools = Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    ws.send(
      JSON.stringify({
        type: 'tools',
        tools,
      })
    );
  }

  /**
   * Send error response
   */
  private sendErrorResponse(ws: WebSocket, message: string, id?: string): void {
    ws.send(
      JSON.stringify({
        type: 'error',
        id,
        error: message,
      })
    );
  }

  /**
   * Register a tool with the MCP server
   */
  public registerTool(name: string, tool: Tool): void {
    this.tools.set(name, tool);
    console.log(`Tool registered: ${name}`);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    // Close all connections
    this.connections.forEach((ws) => {
      try {
        ws.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    });

    // Close server
    try {
      this.httpServer.close();
      this.wsServer.close();
    } catch (error) {
      console.error('Error closing HTTP/WebSocket server:', error);
    }

    // Dispose of other resources
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];

    console.log('MCP Server disposed');
  }
}
