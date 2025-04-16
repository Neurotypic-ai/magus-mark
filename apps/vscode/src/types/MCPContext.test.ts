import { expect } from 'chai';

import type { MCPContext } from './MCPContext';

suite('MCPContext', () => {
  test('validates MCP context', () => {
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

    expect(context.extensionPath).to.equal('/path/to/extension');
    expect(context.workspacePath).to.equal('/path/to/workspace');
    expect(context.serverPort).to.equal(9000);
    expect(context.sessionId).to.equal('session-123');
    expect(context.capabilities.tagging).to.equal(true);
    expect(context.capabilities.modelAccess).to.equal(true);
    expect(context.capabilities.fileAccess).to.equal(true);
  });
});
