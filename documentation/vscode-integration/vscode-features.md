# VS Code-Specific Features

This document details the features and functionality specific to the VS Code implementation of Obsidian Magic, highlighting capabilities beyond those shared with other platforms.

## Extension Framework

The VS Code extension leverages the robust VS Code Extension API to provide deep integration with the editor's ecosystem:

- **VS Code Extension API**: Full implementation of VS Code's Extension API capabilities
- **Workspace Trust**: Respects VS Code's workspace trust model for secure operation
- **Extension Pack Integration**: Can be bundled with complementary extensions
- **Remote Development**: Support for VS Code's remote development features
- **Portable Mode**: Compatible with VS Code portable installations

## Custom Views & Activities

### Tree Views

- **Tag Explorer**: Dedicated view in the Explorer sidebar for tag navigation
- **Vault Browser**: Browse attached Obsidian vaults directly within VS Code
- **Related Notes**: Display contextually related notes based on current file
- **Recent Activity**: Track recently edited or viewed tagged content

### WebView Panels

- **Knowledge Graph**: Interactive visualization of knowledge connections
- **Tag Dashboard**: Analytics and insights about your tag ecosystem
- **AI Assistant Panel**: Dedicated interface for AI-powered tag suggestions
- **Markdown Preview**: Enhanced preview with tag highlighting and navigation

## Editor Integrations

### Language Features

- **Semantic Highlighting**: Custom token highlighting for tags in frontmatter and content
- **Code Lens**: Interactive code lens over tag definitions and references
- **Diagnostics**: Validation of tag formats and consistency warnings
- **Folding**: Smart folding for tag sections and related content
- **Outline View**: Enhanced document outline with tag structure

### Editing Enhancements

- **Snippets**: Predefined snippets for common tag structures
- **Formatting**: Tag-aware Markdown formatting
- **IntelliSense**: Rich autocompletion with tag descriptions and usage stats
- **Quick Fix**: One-click actions to fix tag-related issues
- **Refactoring**: Tools for renaming and restructuring tags across files

## Commands & Keybindings

- **Global Commands**: Extension-specific commands accessible via Command Palette
- **Contextual Commands**: Right-click context menu actions for tags
- **Custom Keybindings**: Predefined keyboard shortcuts for common operations
- **Chord Keybindings**: Multi-key sequences for complex operations
- **When Clauses**: Context-sensitive command availability

## Settings & Configuration

- **User Settings**: Comprehensive user-configurable options
- **Workspace Settings**: Project-specific configurations
- **Default Settings**: Sensible defaults with explanatory comments
- **Setting Validation**: Input validation for setting values
- **UI Settings Editor**: Custom settings editor for complex configurations

## VS Code-Specific UI Components

- **Status Bar Items**: Dynamic status indicators and quick actions
- **Progress Notifications**: Background process visualization
- **Welcome View**: First-run experience and getting started content
- **Notification System**: Custom notifications with rich actions
- **Quick Picks**: Enhanced selection dialogs with search and filtering

## Theming & Customization

- **Theme Integration**: Respects VS Code's current theme
- **Custom Icon Set**: Dedicated iconography for tags and actions
- **Custom Editor Decorations**: Tag-specific decorations in the editor
- **Color Customization**: User-configurable colors for tags
- **Layout Options**: Flexible panel positioning and sizing

## Performance Optimizations

- **Virtual Documents**: Virtual filesystem for efficient tag access
- **Lazy Loading**: On-demand component activation
- **Caching**: Aggressive caching strategy for tag data
- **Incremental Updates**: Smart diffing for tag changes
- **Background Processing**: Non-blocking operations for large repositories

## Integration with VS Code Extensions

- **Markdown Extensions**: Compatible with popular Markdown extensions
- **Git Integration**: Tag-aware source control operations
- **Remote Extensions**: Support for remote workspaces and containers
- **Testing Extensions**: Tag-based test selection and filtering
- **Jupyter Notebook**: Tag support in notebook cells

## Platform-Specific Features

- **Windows Integration**: Native Windows integration features
- **macOS Integration**: macOS-specific capabilities
- **Linux Support**: Full feature support on Linux distributions
- **WSL Compatibility**: Works with Windows Subsystem for Linux
- **Remote Containers**: Compatible with development containers

## Experimental Features

- **Language Server**: Tag-aware language server implementation
- **Custom Editors**: Specialized editors for tag-heavy content
- **Web Extension**: Progressive support for VS Code for Web
- **Notebook Integration**: Custom notebook for tag exploration
- **Workspace Trust Integration**: Tag operations sensitive to trust level

## Related Documentation

- [Obsidian Vault Integration](./vault-integration.md)
- [Cursor Integration](./cursor-integration.md)
- [Developer Experience](./developer-experience.md)
- [Troubleshooting](./troubleshooting.md) 