# VS Code & Cursor Integration

The VS Code extension component of Obsidian Magic delivers a seamless integration experience, bringing the power of AI tagging directly into your development environment while maintaining bidirectional compatibility with Obsidian vaults.

## Key Features

- Bidirectional sync between VS Code and Obsidian
- Advanced tag exploration and visualization
- Deep integration with Cursor AI features
- Tag-based code snippet recommendations
- Knowledge graph exploration in development context
- Custom MCP server integration for enhanced AI capabilities
- Cross-platform support (Windows, macOS, Linux)

## Core Integration Architecture

The plugin implements a sophisticated multi-environment architecture:

### Vault Discovery & Integration

- Automatic detection of Obsidian vaults within the workspace
- Support for multiple vault configurations simultaneously
- Smart discovery of `.obsidian` folders with configuration parsing
- On-demand reload of vault changes for real-time synchronization
- Conflict resolution for multi-editor environments

### Cross-Editor Compatibility

- Bidirectional synchronization with Obsidian
- Common data format with Obsidian plugin
- Portable settings between environments
- Consistent tag visualization regardless of editor
- Real-time collaborative editing support

### Extension Architecture

- Modular design with clear separation of concerns
- Extensible plugin API for third-party additions
- WebSocket server for inter-process communication
- Performance-optimized WebView implementation
- Event-driven architecture for responsive UI

## User Interface Components

### Tag Explorer View

- Dedicated sidebar view for tag navigation
- Hierarchical tag tree with usage statistics
- Drag-and-drop tag organization
- Quick tag search and filtering
- Custom visualization options for different tag types

### Editor Enhancements

- Syntax highlighting for frontmatter tags
- Inline tag decorations in markdown files
- Tag autocompletion with intelligent suggestions
- Quick fix actions for tag management
- Hover information with related content preview

### Command Palette Integration

- Comprehensive command set for tagging operations
- Custom keybindings for frequent operations
- Contextual commands based on file type and content
- Slash commands for quick tag application
- Fuzzy search for tag-related commands

### Status Bar

- Real-time tag status indicators
- Processing status for background operations
- Quick access to tag management
- Sync status with Obsidian vaults
- AI processing indicators

## Cursor-Specific Integration

### Cursor Detection & Activation

- Runtime detection of Cursor environment
- Dynamic feature activation based on Cursor's presence
- Customized UI elements that match Cursor's design language
- VS Code extension API compatibility layer
- Automatic configuration based on Cursor settings

### AI Model Integration

- Integration with Cursor's AI models (Claude 3.5, GPT-4, Claude 3 Sonnet, Claude 3 Haiku, etc.)
- Support for Cursor Agent mode with enhanced knowledge access
- Composer panel augmentation with tag suggestions
- Custom Cursor commands for tag management
- Personalized AI context through custom instructions

### MCP Server Architecture

The plugin implements a Model Context Protocol (MCP) server that acts as a bridge between Cursor's AI capabilities and the tagging system:

```
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│                │       │                │       │                │
│  Cursor Editor │◄─────►│   MCP Server   │◄─────►│  Tag System    │
│                │       │                │       │                │
└────────────────┘       └────────┬───────┘       └────────────────┘
                                  │                        ▲
                                  ▼                        │
                         ┌────────────────┐       ┌────────────────┐
                         │                │       │                │
                         │  AI Functions  │──────►│ Notes Database │
                         │                │       │                │
                         └────────────────┘       └────────────────┘
```

The MCP server provides:

- Standardized API for model-agnostic interactions
- Tool-calling capabilities for AI agents
- Context window management for optimal token usage
- Function calling with type-safe interfaces
- Persistent memory across coding sessions

### AI-Enhanced Workflows

- When using Cursor's AI features, automatically retrieve relevant notes
- Surface tagged information based on current coding context
- Provide documentation snippets from knowledge base during development
- Enable "consciousness stream" for AI across conversations
- Personalized code suggestions based on your tagging patterns

## Community Integration

- Integration with Cursor forums for community support
- Shared custom instructions repository
- Community-contributed prompt templates
- User-submitted workflows and automations
- Collaborative tagging conventions and best practices

## Installation & Setup

- One-click installation from VS Code marketplace
- Optional Cursor-specific configuration
- Automatic detection of Obsidian vaults
- Guided setup wizard for first-time users
- Comprehensive settings interface

## Detailed Features

- [VS Code-Specific Features](./vscode-features.md)
- [Obsidian Vault Integration](./vault-integration.md)
- [Cursor Integration](./cursor-integration.md)
- [MCP Server Implementation](./mcp-server.md)
- [Developer Experience](./developer-experience.md)

## Related Components

- The VS Code extension shares core tagging logic with both the [CLI Tool](../cli/cli-overview.md) and [Obsidian Plugin](../obsidian-plugin/plugin-overview.md)
- [Contribution Guidelines](../contributing/extension-development.md)
- [Troubleshooting & FAQ](./troubleshooting.md) 