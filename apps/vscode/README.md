# Magus Mark VS Code Extension

AI-powered tagging system for organizing AI chat history and technical knowledge, seamlessly connecting VS Code with
Obsidian.

## Features

- **VS Code to Obsidian Bridge**: Sync content between VS Code and your Obsidian vaults
- **Cursor AI Integration**: Special integration with Cursor AI for enhanced experience
- **AI-Powered Tagging**: Automatically analyze code snippets and conversations to apply consistent tags
- **Tag Explorer**: Browse and filter your Obsidian content by tags directly from VS Code
- **Contextual Search**: Find relevant Obsidian notes based on your current VS Code context
- **Bidirectional Editing**: Make changes in VS Code that sync back to Obsidian
- **MCP Server Integration**: Model Context Protocol server for enhanced AI capabilities
- **Vault Management**: Add, remove, and configure multiple Obsidian vaults

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Magus Mark"
4. Click "Install"

### Manual Installation

1. Download the latest `.vsix` file from the [GitHub releases page](https://github.com/magus-mark/magus-mark/releases)
2. Open VS Code
3. Go to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
4. Click on the "..." menu and select "Install from VSIX..."
5. Navigate to the downloaded file and open it

### Cursor Installation

If you're using Cursor IDE:

1. Open Cursor
2. Go to the Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Magus Mark"
4. Click "Install"

## Getting Started

1. After installation, open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Magus Mark: Add Vault" to connect to your Obsidian vault
3. Configure your OpenAI API key in settings
4. Open the Tag Explorer view from the Activity Bar

## Commands

- **Tag Current File**: Analyze and tag the current file
- **Open Tag Explorer**: Open the dedicated tag browser
- **Tag with Cursor AI**: Use Cursor AI to tag the selected text or current file
- **Register @magus-mark Participant**: Set up the VS Code participant for MCP
- **Ask @magus-mark a Question**: Query VS Code with AI assistance
- **Add New Tag**: Create a new tag in the taxonomy
- **Delete Tag**: Remove a tag from the taxonomy
- **Manage Vaults**: Configure connected Obsidian vaults
- **Add Vault**: Connect a new Obsidian vault
- **Remove Vault**: Disconnect an Obsidian vault
- **Sync Vault**: Manually sync with connected vaults

## Configuration

Open VS Code settings and search for "Magus Mark" to configure:

- **API Key**: Your OpenAI API key
- **Cursor Features**: Enable/disable Cursor-specific integrations
- **MCP Server Port**: Configure the Model Context Protocol server port
- **Vault Auto-Sync**: Enable/disable automatic synchronization
- **Vault Auto-Detect**: Automatically detect Obsidian vaults in the workspace

## Privacy & Security

- Your documents are processed using the OpenAI API with your personal API key
- No data is stored by the extension developers
- API keys are stored securely using VS Code's secret storage
- All processing happens through direct API calls to OpenAI

## Developer Features

For developers, the extension offers:

- **MCP Server**: Model Context Protocol server for Cursor AI integration
- **VS Code Participant**: `@magus-mark` participant for AI tools
- **Contextual Knowledge**: Automatically retrieve relevant notes based on code context
- **Cross-IDE Experience**: Same tagging system across Obsidian and VS Code

## Support & Documentation

- [Full Documentation](https://github.com/magus-mark/magus-mark/wiki)
- [Report Issues](https://github.com/magus-mark/magus-mark/issues)
- [Request Features](https://github.com/magus-mark/magus-mark/issues/new?template=feature_request.md)

## Requirements

- VS Code 1.99.0 or higher
- OpenAI API key

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built on the VS Code Extension API
- Powered by OpenAI's language models
- Enhanced integration with Cursor AI
- Seamless connection with Obsidian
