# Obsidian Plugin Overview

The Obsidian plugin component of Obsidian Magic delivers a seamless integration with Obsidian's UI paradigms while providing powerful tagging capabilities.

## Key Features

- Process individual notes or entire folders with AI-powered tagging
- Intuitive UI with deep integration into Obsidian's interface
- Dedicated tag management workspace with advanced visualization
- Secure API key management with multiple storage options
- Interactive conflict resolution for existing tags
- Extensive integration with other Obsidian plugins

## Core Interface Components

### Command Palette Integration

- Register custom commands for all tagging operations
- Keyboard shortcuts for common tagging workflows
- Quick command access via fuzzy search

### Context Menu Enhancements

- Right-click on files or folders to access tagging operations
- Intelligent context awareness (different options for individual files vs. folders)
- Preview counts of affected files when selecting folders

### Dedicated Tag Management Workspace

- Custom view that registers in Obsidian's workspace layout system
- Can be positioned in left sidebar, right sidebar, or as a tab in the main content area
- Draggable, resizable, and persistent between sessions

### Status Bar Integration

- Real-time indicators for:
  - API usage and quota status
  - Processing status when batch operations are running
  - Quick access to tag management

### Ribbon Button

- Quick access to tag management view
- Status indicator showing synchronization state
- Tooltip with usage statistics

## Detailed Features

- [Tag Management Interface](./tag-management.md)
- [Security & Configuration](./security-configuration.md)
- [Document Integration](./document-integration.md)
- [Ecosystem Integration](./ecosystem-integration.md)

## Related Components

- The Obsidian plugin shares core tagging logic with the [CLI Tool](../cli/cli-overview.md)
- The plugin has bidirectional integration with [VS Code & Cursor](../vscode-integration/vscode-overview.md) 