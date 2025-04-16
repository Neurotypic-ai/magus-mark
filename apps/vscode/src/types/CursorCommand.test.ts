import { describe, expect, it, vi } from 'vitest';

import type { CursorCommand } from './CursorCommand';
import type { MCPContext } from './MCPContext';

describe('CursorCommand', () => {
  it('validates cursor command', () => {
    const mockExecute = vi.fn().mockResolvedValue({ success: true });

    const command: CursorCommand = {
      name: 'Tag Document',
      id: 'obsidian-magic.tagDocument',
      execute: mockExecute,
    };

    expect(command.name).toBe('Tag Document');
    expect(command.id).toBe('obsidian-magic.tagDocument');

    // Test execution
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

    void command.execute(context, { documentUri: 'file:///path/to/doc.md' });
    expect(mockExecute).toHaveBeenCalledWith(context, { documentUri: 'file:///path/to/doc.md' });
  });
});
