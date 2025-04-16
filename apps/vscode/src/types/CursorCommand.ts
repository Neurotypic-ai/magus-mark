import type { MCPContext } from './MCPContext';

/**
 * Cursor command definition
 */

export interface CursorCommand {
  name: string;
  id: string;
  execute: (context: MCPContext, params: Record<string, unknown>) => Promise<unknown>;
}
