import { describe, expect, it } from 'vitest';

import type { MCPContext } from './MCPContext';

describe('MCPContext', () => {
  it('validates MCP context', () => {
    const context: MCPContext = {
      extensionPath: '/path/to/extension',
      workspacePath: '/path/to/workspace',
      serverPort: 9000,
      sessionId: 'session-123',
      capabilities: {
        tagging: true,
        modelAccess: true,
        fileAccess: true,
      },
    };

    expect(context.extensionPath).toBe('/path/to/extension');
    expect(context.workspacePath).toBe('/path/to/workspace');
    expect(context.serverPort).toBe(9000);
    expect(context.sessionId).toBe('session-123');
    expect(context.capabilities.tagging).toBe(true);
    expect(context.capabilities.modelAccess).toBe(true);
    expect(context.capabilities.fileAccess).toBe(true);
  });
});
