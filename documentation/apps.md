# Apps Documentation

This directory contains the application implementations for the Magus Mark project. Each app provides a different
interface for the core tagging functionality.

## Applications Overview

| App               | Package Name           | Description                                  | Platform       |
| ----------------- | ---------------------- | -------------------------------------------- | -------------- |
| CLI               | `@magus-mark/cli`      | Command-line tool for batch processing       | Terminal       |
| Obsidian Plugin   | `@magus-mark/obsidian` | Native Obsidian plugin for in-app tagging    | Obsidian       |
| VS Code Extension | `magus-mark-vscode`    | VS Code extension with Cursor AI integration | VS Code/Cursor |

## CLI Application

**Package:** `@magus-mark/cli`  
**Location:** `apps/cli/`  
**Binary:** `magus`

### Overview

The CLI application provides a command-line interface for batch processing markdown files with AI-powered tagging. It's
designed for users who prefer terminal-based workflows or need to process large numbers of files efficiently.

### Key Features

- Batch processing of markdown files
- Interactive and non-interactive modes
- Progress visualization with progress bars
- Cost estimation and token usage tracking
- Configuration via environment variables and config files
- Update notifications

### Dependencies

- **Yargs** - Command parsing and CLI structure
- **Inquirer** - Interactive prompts and user input
- **Chalk** - Terminal output styling
- **Ora** - Spinner and loading indicators
- **CLI Progress** - Progress bars for batch operations
- **Boxen** - Styled message boxes
- **Update Notifier** - Notifies users of available updates

### Commands

- `tag` - Tag markdown files with AI
- `config` - Manage configuration
- `stats` - View usage statistics

## Obsidian Plugin

**Package:** `@magus-mark/obsidian`  
**Location:** `apps/obsidian-plugin/`  
**Type:** Private package (not published to npm)

### Overview

The Obsidian plugin integrates directly into the Obsidian app, providing seamless tagging functionality within the
user's note-taking workflow. It includes UI components that match Obsidian's design language.

### Key Features

- Native Obsidian UI integration
- Real-time tagging as you write
- Token usage tracking
- Settings panel for configuration
- Hot reload support for development
- Accessibility-compliant UI components

### Technical Details

- Built with esbuild for optimal performance
- Uses Obsidian's API for vault access
- Includes CodeMirror integration for editor features
- Supports Electron APIs for system integration

### Development Features

- Hot reload support
- Installation script for testing in documentation vault
- Bundle size analysis
- Accessibility checking

## VS Code Extension

**Package:** `magus-mark-vscode`  
**Location:** `apps/vscode/`  
**Publisher:** `khallmark`

### Overview

The VS Code extension brings Magus Mark functionality to Visual Studio Code and Cursor AI. It features deep integration
with Cursor's AI capabilities through the Model Context Protocol (MCP).

### Key Features

- Tag markdown files directly in VS Code
- Cursor AI participant (`@magus-mark`)
- Tag Explorer side panel
- Vault synchronization with Obsidian
- MCP server for AI context
- WebSocket communication for real-time updates

### Cursor-Specific Features

- **MCP Server Integration**: Runs a Model Context Protocol server for AI context
- **@magus-mark Participant**: Custom AI participant for Cursor
- **Bidirectional Sync**: Keeps VS Code and Obsidian vaults in sync

### Commands

- `magus-mark.tagFile` - Tag the current file
- `magus-mark.cursorTagFile` - Tag with Cursor AI
- `magus-mark.openTagExplorer` - Open the tag explorer
- `magus-mark.cursorRegisterVSCodeParticipant` - Register @magus-mark participant
- `magus-mark.manageVaults` - Manage Obsidian vault connections

### Configuration

- `obsidianMagic.cursorFeatures.enabled` - Enable Cursor-specific features
- `obsidianMagic.cursorFeatures.mcpServerPort` - MCP server port (default: 9876)
- `obsidianMagic.vault.autoDetect` - Auto-detect Obsidian vaults
- `obsidianMagic.vault.autoSync` - Auto-sync on startup

## Common Characteristics

All applications share these common traits:

1. **Core Dependency**: All apps depend on `@magus-mark/core` for business logic
2. **TypeScript**: Written in TypeScript 5.8.3 with strict type checking
3. **Testing**: Use Vitest for testing (except VS Code which uses Mocha)
4. **Linting**: Share ESLint configuration via `@magus-mark/eslint-config`
5. **Build System**: Integrated with Nx workspace for coordinated builds
6. **Error Handling**: Implement Result pattern for error handling
7. **Accessibility**: Follow WCAG guidelines for UI components

## Development Workflow

### Building Apps

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @magus-mark/cli build
pnpm --filter @magus-mark/obsidian build
pnpm --filter magus-mark-vscode build
```

### Testing Apps

```bash
# Test all apps
pnpm test

# Test specific app
pnpm --filter @magus-mark/cli test
pnpm --filter @magus-mark/obsidian test
pnpm --filter magus-mark-vscode test
```

### Development Mode

```bash
# CLI development
pnpm --filter @magus-mark/cli dev

# Obsidian plugin development (with hot reload)
pnpm --filter @magus-mark/obsidian dev

# VS Code extension development
# Use VS Code's extension development host
```

## Architecture Notes

- **State Management**: Apps maintain minimal state, delegating to core services
- **Configuration**: Each app handles its platform-specific configuration format
- **UI Patterns**: Apps adapt core functionality to their platform's UI paradigms
- **Testing Strategy**: Unit tests for logic, integration tests for platform APIs
- **Error Boundaries**: Each app implements appropriate error handling for its platform

## Future Considerations

- **Web App**: Potential future app for browser-based access
- **Mobile Apps**: Native mobile applications for iOS/Android
- **API Server**: REST/GraphQL API for third-party integrations
- **Desktop App**: Electron-based standalone application
