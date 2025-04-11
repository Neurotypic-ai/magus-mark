# VS Code & Cursor Integration

The VS Code extension component of Obsidian Magic delivers a seamless integration experience, bringing the power of AI tagging directly into your development environment while maintaining bidirectional compatibility with Obsidian vaults.

## Key Features

- Bidirectional sync between VS Code and Obsidian
- Advanced tag exploration and visualization
- Deep integration with Cursor AI features
- Tag-based code snippet recommendations
- Knowledge graph exploration in development context

## Core Integration Architecture

The plugin implements a sophisticated multi-environment architecture:

### Vault Discovery & Integration

- Automatic detection of Obsidian vaults within the workspace
- Support for multiple vault configurations simultaneously
- Smart discovery of `.obsidian` folders with configuration parsing
- On-demand reload of vault changes for real-time synchronization

### Cross-Editor Compatibility

- Bidirectional synchronization with Obsidian
- Common data format with Obsidian plugin
- Portable settings between environments
- Consistent tag visualization regardless of editor

### Extension Architecture

- Modular design with clear separation of concerns
- Extensible plugin API for third-party additions
- WebSocket server for inter-process communication
- Performance-optimized WebView implementation

## User Interface Components

### Tag Explorer View

- Dedicated sidebar view for tag navigation
- Hierarchical tag tree with usage statistics
- Drag-and-drop tag organization
- Quick tag search and filtering

### Editor Enhancements

- Syntax highlighting for frontmatter tags
- Inline tag decorations in markdown files
- Tag autocompletion with intelligent suggestions
- Quick fix actions for tag management

### Command Palette Integration

- Comprehensive command set for tagging operations
- Custom keybindings for frequent operations
- Contextual commands based on file type and content
- Slash commands for quick tag application

### Status Bar

- Real-time tag status indicators
- Processing status for background operations
- Quick access to tag management
- Sync status with Obsidian vaults

## Cursor-Specific Integration

### Cursor Detection & Activation

- Runtime detection of Cursor environment
- Dynamic feature activation based on Cursor's presence
- Customized UI elements that match Cursor's design language
- VS Code extension API compatibility layer

### AI Model Integration

- Integration with Cursor's AI models (Claude, GPT-4, Sonnet, Haiku, etc.)
- Support for Cursor Agent mode with enhanced knowledge access
- Composer panel augmentation with tag suggestions
- Custom Cursor commands for tag management

### MCP Server Architecture

The plugin implements a Model Control Protocol (MCP) server that acts as a bridge between Cursor's AI capabilities and the tagging system:

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

### AI-Enhanced Workflows

- When using Cursor's AI features, automatically retrieve relevant notes
- Surface tagged information based on current coding context
- Provide documentation snippets from knowledge base during development
- Enable "consciousness stream" for AI across conversations

## Detailed Features

- [VS Code-Specific Features](./vscode-features.md)
- [Obsidian Vault Integration](./vault-integration.md)
- [Cursor Integration](./cursor-integration.md)
- [Developer Experience](./developer-experience.md)

## Related Components

- The VS Code extension shares core tagging logic with both the [CLI Tool](../cli/cli-overview.md) and [Obsidian Plugin](../obsidian-plugin/plugin-overview.md) 