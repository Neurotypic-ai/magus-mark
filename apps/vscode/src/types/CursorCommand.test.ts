import { expect } from 'chai';
import * as sinon from 'sinon';

import type { CursorCommand } from './CursorCommand';
import type { MCPContext } from './MCPContext';

suite('CursorCommand', () => {
  test('validates cursor command', async () => {
    const mockExecute = sinon.stub().resolves({ success: true });

    const command: CursorCommand = {
      name: 'Tag Document',
      id: 'obsidian-magic.tagDocument',
      execute: mockExecute,
    };

    expect(command.name).to.equal('Tag Document');
    expect(command.id).to.equal('obsidian-magic.tagDocument');

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

    const args = { documentUri: 'file:///path/to/doc.md' };
    await command.execute(context, args);

    // Use Sinon's assertion API
    sinon.assert.calledWith(mockExecute, context, args);
  });
});
