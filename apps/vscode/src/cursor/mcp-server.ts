import * as http from 'http';

import * as vscode from 'vscode';
import { server as WebSocketServer } from 'websocket';

import { LanguageModelAPI } from './language-model-api';
import { VSCodeParticipant } from './participants/vscode-participant';

import type { connection } from 'websocket';

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
 * Enables VS Code extension to participate in Cursor AI conversations via the @vscode participant
 */
export class MCPServer implements vscode.Disposable {
  private httpServer: http.Server;
  private wsServer: WebSocketServer;
  private connections: connection[] = [];
  private tools = new Map<string, Tool>();
  private participant: VSCodeParticipant | undefined;
  private languageModelAPI: LanguageModelAPI | undefined;
  private disposables: vscode.Disposable[] = [];
  private port: number;

  constructor(context: vscode.ExtensionContext) {
    // Get configured port from settings
    const config = vscode.workspace.getConfiguration('obsidianMagic');
    this.port = config.get<number>('cursorFeatures.mcpServerPort', 9876);

    // Initialize HTTP server
    this.httpServer = http.createServer((request, response) => {
      response.writeHead(404);
      response.end();
    });

    // Initialize WebSocket server
    this.wsServer = new WebSocketServer({
      httpServer: this.httpServer,
      autoAcceptConnections: false,
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
    this.wsServer.on('request', (request) => {
      try {
        // In a real implementation, we would verify the origin
        const connection = request.accept(null, request.origin);
        this.connections.push(connection);

        console.log('WebSocket connection accepted from:', request.origin);

        // Handle incoming messages
        connection.on('message', (message) => {
          // Handle only UTF8 messages
          if (message.type === 'utf8') {
            // Access utf8Data safely by asserting the type
            const utf8Message = message as { type: 'utf8'; utf8Data: string };
            if (utf8Message.utf8Data) {
              this.handleUtf8Message(connection, utf8Message.utf8Data);
            }
          } else {
            console.warn('Received non-UTF8 message, ignoring');
          }
        });

        // Handle connection close
        connection.on('close', (reasonCode, description) => {
          console.log(`WebSocket connection closed: ${reasonCode.toString()} - ${description}`);
          this.connections = this.connections.filter((conn) => conn !== connection);
        });
      } catch (error) {
        console.error('Error handling WebSocket request:', error);
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
          systemPrompt: `You are the @vscode participant in Cursor/VS Code. 
You have expert knowledge about VS Code, its features, settings, and extensions.
Provide helpful, accurate, and concise responses to questions about VS Code.
If applicable, provide specific commands, keyboard shortcuts, or settings that can help the user.`,
        });

        return { response };
      },
    });
  }

  /**
   * Handle UTF-8 message
   */
  private handleUtf8Message(connection: connection, utf8Data: string): void {
    try {
      const data = JSON.parse(utf8Data) as MCPMessage;

      if (data.type === 'invoke') {
        void this.handleToolInvocation(connection, data);
      } else if (data.type === 'list_tools') {
        this.handleListTools(connection);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      this.sendErrorResponse(connection, 'Failed to parse message');
    }
  }

  /**
   * Handle tool invocation request
   */
  private async handleToolInvocation(connection: connection, data: MCPMessage): Promise<void> {
    const toolName = data.toolName;
    const parameters = data.parameters;

    if (!toolName) {
      this.sendErrorResponse(connection, 'Tool name is required', data.id);
      return;
    }

    const tool = this.tools.get(toolName);

    if (!tool) {
      this.sendErrorResponse(connection, `Tool not found: ${toolName}`, data.id);
      return;
    }

    try {
      // Execute the tool
      const result = await tool.execute(parameters ?? {});

      // Send response
      connection.sendUTF(
        JSON.stringify({
          type: 'result',
          id: data.id,
          result,
        })
      );
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      this.sendErrorResponse(
        connection,
        `Error executing tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
        data.id
      );
    }
  }

  /**
   * Handle list tools request
   */
  private handleListTools(connection: connection): void {
    const tools = Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    connection.sendUTF(
      JSON.stringify({
        type: 'tools',
        tools,
      })
    );
  }

  /**
   * Send error response
   */
  private sendErrorResponse(connection: connection, message: string, id?: string): void {
    connection.sendUTF(
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
    this.connections.forEach((connection) => {
      try {
        connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    });

    // Close server
    try {
      this.httpServer.close();
    } catch (error) {
      console.error('Error closing HTTP server:', error);
    }

    // Dispose of other resources
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];

    console.log('MCP Server disposed');
  }
}
