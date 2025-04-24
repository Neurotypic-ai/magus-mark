# Magus Mark

AI-powered tagging system for organizing AI chat history and technical knowledge in Obsidian.

## Features

- **AI-Powered Document Tagging**: Automatically analyze the content of your notes and apply consistent, meaningful tags
- **Frontmatter Integration**: Store tags in YAML frontmatter for seamless integration with other Obsidian plugins
- **Tag Management View**: Dedicated interface for organizing and managing your tag taxonomy
- **Visualization Tools**: Visual exploration of your knowledge graph through tag relationships
- **Batch Processing**: Tag individual files or entire folders with a single command
- **Customizable Model**: Choose between different AI models to balance accuracy and cost
- **API Key Security**: Securely store your OpenAI API key using system keychain or local encrypted storage

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/magus-mark/magus-mark/ci.yml?branch=main)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/magus-mark/magus-mark)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22magus-mark%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidian-community%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![WCAG Compliance](https://img.shields.io/badge/WCAG-AA%20Compliant-green)
![Dependencies](https://img.shields.io/github/actions/workflow/status/magus-mark/magus-mark/dependencies.yml?branch=main&label=dependencies)
![Code Quality](https://img.shields.io/github/actions/workflow/status/magus-mark/magus-mark/security.yml?branch=main&label=security)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![License](https://img.shields.io/github/license/magus-mark/magus-mark)

## Installation

### From Obsidian Community Plugins

1. Open Obsidian and go to Settings
2. Navigate to "Community plugins" and turn off "Safe mode"
3. Click "Browse" and search for "Magus Mark"
4. Click "Install" and then "Enable"

### Manual Installation

1. Download the latest release from the [GitHub releases page](https://github.com/magus-mark/magus-mark/releases)
2. Extract the zip file into your Obsidian plugins folder: `{vault}/.obsidian/plugins/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

## Getting Started

1. After installation, open the plugin settings and add your OpenAI API key
2. Choose your preferred storage method for the API key (system keychain recommended)
3. Configure your tagging preferences (model, default behavior, etc.)
4. Use the command palette (Ctrl/Cmd+P) to run "Magus Mark: Tag Current File" or right-click any file or folder in the
   explorer

## Commands

- **Tag Current File**: Analyze and tag the currently open document
- **Tag Folder**: Process all markdown files in a folder
- **Open Tag Management**: Open the dedicated tag management interface
- **Open Tag Visualization**: View your knowledge graph through tag relationships

## Privacy & Security

- Your documents are processed using the OpenAI API with your personal API key
- No data is stored by the plugin developers
- API keys can be stored securely in your system's keychain
- All processing happens through direct API calls to OpenAI

## Neurodiversity Support

Magus Mark is designed with neurodivergent users in mind:

- **Reduced Visual Noise**: Clean, focused interfaces that minimize distractions
- **Motion Control**: All animations can be disabled in settings
- **Color Accessibility**: High contrast options and careful color selection for dyslexic users
- **Keyboard Navigation**: Complete keyboard control for all features
- **Focus Management**: Clear focus indicators and logical tab order
- **Processing Support**: Consistent layouts and predictable behavior to reduce cognitive load
- **Sensory Considerations**: No flashing elements or sudden movements

Our development process includes regular testing with neurodivergent users and automated checks against WCAG 2.1 AA
standards plus additional neurodiversity-specific guidelines.

## Support & Documentation

- [Full Documentation](https://github.com/magus-mark/magus-mark/wiki)
- [Report Issues](https://github.com/magus-mark/magus-mark/issues)
- [Request Features](https://github.com/magus-mark/magus-mark/issues/new?template=feature_request.md)

## Development

For developers interested in contributing to Magus Mark:

### Quick Start

```bash
# Clone the repository
git clone https://github.com/magus-mark/magus-mark.git
cd magus-mark

# Install dependencies
pnpm install

# Build the plugin
cd apps/obsidian-plugin
pnpm run build

# For development with auto-rebuilding
pnpm run dev
```

### Quality Assurance

```bash
# Run tests
pnpm run test

# Check accessibility compliance
pnpm run check-accessibility

# Analyze bundle size and composition
pnpm run bundle-analysis
```

### CI/CD Pipeline

The project includes comprehensive CI workflows that run on every pull request:

- **Linting & Type Checking**: Ensures code quality and type safety
- **Unit Tests**: Verifies correct functionality of all components
- **Accessibility Testing**: Validates WCAG 2.1 AA compliance
- **Bundle Analysis**: Monitors bundle size and composition

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete development guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built on the Obsidian Plugin API
- Powered by OpenAI's language models
- Inspired by the needs of knowledge workers and learners
