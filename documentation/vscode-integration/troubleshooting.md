# Troubleshooting & FAQ

This document provides solutions to common issues and answers to frequently asked questions about the Obsidian Magic VS Code extension.

## Installation Issues

### Extension Not Installing

**Issue**: Unable to install the extension from VS Code Marketplace.

**Solutions**:
1. Check your internet connection
2. Verify VS Code version compatibility
3. Try installing with the command `code --install-extension obsidian-magic`
4. Download the VSIX file manually and install via "Install from VSIX"
5. Check for conflicting extensions

### Extension Not Activating

**Issue**: Extension is installed but not activating.

**Solutions**:
1. Verify workspace contains a valid project
2. Check the VS Code output panel for error messages
3. Ensure you have the necessary permissions
4. Try restarting VS Code with the `--disable-extensions` flag, then enable just this extension
5. Check your extension settings for configuration issues

## Obsidian Vault Issues

### Vault Not Detected

**Issue**: Extension cannot detect Obsidian vault.

**Solutions**:
1. Ensure your workspace includes a valid Obsidian vault
2. Check that the `.obsidian` folder exists and is accessible
3. Manually specify the vault path in extension settings
4. Verify file system permissions
5. Check if the vault is currently in use by Obsidian (which may lock certain files)

### Synchronization Failures

**Issue**: Changes not synchronizing between VS Code and Obsidian.

**Solutions**:
1. Check the sync status indicator in the status bar
2. Verify both applications have read/write access to the vault
3. Try manual sync via the command palette
4. Check for file locks or conflicts
5. Verify your vault structure is standard and not heavily customized

### Tag Issues

**Issue**: Tags not appearing or not being recognized properly.

**Solutions**:
1. Check tag formatting in both environments
2. Verify frontmatter syntax is correct
3. Try rebuilding the tag index via the command palette
4. Check for tag normalization settings
5. Verify your tags follow the supported format

## Cursor Integration Issues

### Cursor Detection Problems

**Issue**: Extension not detecting it's running in Cursor.

**Solutions**:
1. Verify you're using a compatible Cursor version
2. Check the "About Cursor" information
3. Try reinstalling the extension while in Cursor
4. Reset Cursor settings to defaults and try again
5. Check Cursor logs for extension activation issues

### AI Features Not Working

**Issue**: AI-enhanced features not functioning in Cursor.

**Solutions**:
1. Verify Cursor's AI features are enabled and working
2. Check your API key configuration
3. Verify internet connectivity for AI services
4. Look for rate limiting or quota issues
5. Check the extension's AI integration settings

### MCP Server Connection Issues

**Issue**: MCP server not connecting or responding.

**Solutions**:
1. Check if the MCP server is running in the output panel
2. Verify WebSocket connections are not blocked by firewalls
3. Try restarting the MCP server via the command palette
4. Check for port conflicts
5. Verify Cursor has necessary permissions

## Performance Issues

### Slow Performance

**Issue**: Extension causing slowdowns or high resource usage.

**Solutions**:
1. Check resource usage in Task Manager/Activity Monitor
2. Disable background indexing in settings
3. Reduce the scope of synchronized content
4. Increase the synchronization interval
5. Check for large files that might be causing processing delays

### High Memory Usage

**Issue**: Extension consuming excessive memory.

**Solutions**:
1. Limit the number of files tracked in settings
2. Disable unused features
3. Close unused editors and panels
4. Restart VS Code to clear caches
5. Update to the latest extension version which may have memory optimizations

## UI Issues

### Missing UI Elements

**Issue**: Some UI components not appearing.

**Solutions**:
1. Check view visibility in the View menu
2. Reset VS Code window layout
3. Verify theme compatibility
4. Check for UI extension conflicts
5. Try the command palette to access hidden functionality

### Rendering Problems

**Issue**: UI elements rendering incorrectly.

**Solutions**:
1. Try changing the VS Code theme
2. Check zoom level and display scaling
3. Verify accessibility settings
4. Disable other extensions that modify the UI
5. Reset the VS Code window layout

## Debugging and Logging

### Enabling Debug Logs

To enable detailed logging:

1. Open VS Code settings
2. Search for "Obsidian Magic: Log Level"
3. Set to "Debug" or "Trace" for more detailed information
4. Open the Output panel and select "Obsidian Magic" from the dropdown
5. Reproduce the issue to capture logs

### Submitting Bug Reports

When submitting bug reports:

1. Include VS Code and extension version
2. Attach debug logs if possible
3. Describe steps to reproduce
4. Include screenshots if relevant
5. Mention your operating system and environment

## Common Error Messages

### "Cannot connect to Obsidian vault"

**Cause**: Extension cannot access the Obsidian vault directory.

**Solutions**:
1. Check file permissions
2. Verify the vault path
3. Close Obsidian if it has exclusive locks
4. Check for conflicting plugins

### "MCP server failed to start"

**Cause**: The Model Context Protocol server couldn't initialize.

**Solutions**:
1. Check port availability
2. Verify network settings
3. Check for conflicts with other services
4. Restart VS Code with administrator privileges

### "Tag indexing failed"

**Cause**: The extension couldn't build the tag index.

**Solutions**:
1. Check file permissions
2. Verify vault structure
3. Look for corrupt markdown files
4. Try manual reindexing

## Feature-Specific Issues

### Knowledge Graph Problems

**Issue**: Knowledge graph not rendering or incorrect.

**Solutions**:
1. Check if you have sufficient connected notes
2. Verify graph view settings
3. Try adjusting graph visualization parameters
4. Ensure you have the necessary system requirements for graph rendering
5. Verify WebView rendering is working properly

### Search Issues

**Issue**: Search functionality not working properly.

**Solutions**:
1. Check indexing status
2. Verify search syntax
3. Try rebuilding the search index
4. Check file filters and exclusions
5. Verify content is properly synchronized

## Compatibility Issues

### Version Compatibility

**Issue**: Extension not compatible with your VS Code version.

**Solutions**:
1. Update VS Code to the latest stable version
2. Check minimum required VS Code version
3. Try an older version of the extension
4. Look for compatibility notes in the changelog
5. Check for known issues with your specific VS Code version

### Operating System Compatibility

**Issue**: OS-specific problems.

**Solutions**:
1. **Windows**: Check path length limits and permissions
2. **macOS**: Verify file system permissions and Gatekeeper settings
3. **Linux**: Check file permissions and dependencies
4. **All platforms**: Verify environment variables

## Community Support Resources

- [GitHub Issues](https://github.com/obsidian-magic/vscode-extension/issues)
- [Cursor Forums](https://forum.cursor.com/)
- [Discord Community](https://discord.gg/obsidian-magic)
- [VS Code Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=obsidian-magic.vscode-extension)

## Related Documentation

- [VS Code-Specific Features](./vscode-features.md)
- [Obsidian Vault Integration](./vault-integration.md)
- [Cursor Integration](./cursor-integration.md)
- [MCP Server Implementation](./mcp-server.md)
- [Developer Experience](./developer-experience.md) 