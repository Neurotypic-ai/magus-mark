/**
 * Cursor MCP extension context
 */

export interface MCPContext {
  extensionPath: string;
  workspacePath: string;
  serverPort: number;
  sessionId: string;
  capabilities: {
    tagging: boolean;
    modelAccess: boolean;
    fileAccess: boolean;
  };
}
