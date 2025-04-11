import * as vscode from 'vscode';
import { VSCodeParticipant } from './participants/vscode-participant';

/**
 * Interface for tool registration
 */
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

/**
 * Model Context Protocol (MCP) Server implementation
 * Provides a standard way for AI models to interact with the VS Code/Cursor environment
 */
export class MCPServer {
  private tools: Map<string, Tool> = new Map();
  private readonly context: vscode.ExtensionContext;
  private readonly participants: any[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.initializeServer();
  }

  /**
   * Initialize the MCP server
   */
  private initializeServer(): void {
    console.log('Initializing MCP Server for Cursor integration');

    // Initialize built-in participants
    this.initializeParticipants();

    // Register server capabilities with any Cursor-specific APIs
    this.registerWithCursor();
  }

  /**
   * Initialize built-in participants
   */
  private initializeParticipants(): void {
    // Initialize the @vscode participant
    const vscodeParticipant = new VSCodeParticipant(this.context);
    this.participants.push(vscodeParticipant);
    
    // Register participant's tools
    vscodeParticipant.registerWithMCPServer(this);
  }

  /**
   * Register the server with Cursor-specific APIs if available
   */
  private registerWithCursor(): void {
    try {
      // Check if running in Cursor environment
      // This is a placeholder - actual detection would be different
      const isCursorEnvironment = vscode.env.appName.includes('Cursor');
      
      if (isCursorEnvironment) {
        console.log('Cursor environment detected, registering MCP server with Cursor API');
        
        // This would use Cursor-specific APIs to register the MCP server
        // For now, it's just a placeholder for when those APIs are available
        this.registerToolsWithCursorAPI();
      } else {
        console.log('Not running in Cursor environment, MCP server initialized in standalone mode');
      }
    } catch (error) {
      console.error('Failed to register with Cursor:', error);
    }
  }

  /**
   * Register tools with Cursor API
   * This is a placeholder for when Cursor-specific APIs are available
   */
  private registerToolsWithCursorAPI(): void {
    console.log(`Registered ${this.tools.size} tools with Cursor API`);
    
    // When Cursor provides an API for this, we'd use it here
    // For now, this is just a placeholder
  }

  /**
   * Register a tool with the MCP server
   */
  public registerTool(name: string, tool: Tool): void {
    if (this.tools.has(name)) {
      console.warn(`Tool with name "${name}" already registered, overwriting`);
    }
    
    this.tools.set(name, tool);
    console.log(`Registered tool: ${name}`);
  }

  /**
   * Execute a tool by name
   */
  public async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    
    try {
      return await tool.execute(params);
    } catch (error) {
      console.error(`Error executing tool "${name}":`, error);
      throw error;
    }
  }

  /**
   * Get all registered tools
   */
  public getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Handle tool calls from AI models
   */
  public async handleToolCall(toolCall: { name: string; parameters: any }): Promise<any> {
    const { name, parameters } = toolCall;
    
    try {
      return await this.executeTool(name, parameters);
    } catch (error: unknown) {
      console.error(`Error handling tool call to "${name}":`, error);
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'TOOL_EXECUTION_ERROR'
        }
      };
    }
  }

  /**
   * Dispose of resources when extension is deactivated
   */
  public dispose(): void {
    for (const participant of this.participants) {
      if (participant.dispose) {
        participant.dispose();
      }
    }
    
    this.tools.clear();
    this.participants.length = 0;
  }
} 