# Magus Mark

AI-powered tagging system for organizing AI conversations and technical knowledge in Obsidian.

<p align="center">
  <img src="documentation/assets/magus-mark-logo.png" alt="Magus Mark Logo" width="200" />
</p>

<p align="center">
  <a href="https://github.com/magus-mark/magus-mark/releases/latest">
    <img src="https://img.shields.io/github/v/release/magus-mark/magus-mark" alt="Latest Release">
  </a>
  <a href="https://github.com/magus-mark/magus-mark/actions">
    <img src="https://github.com/magus-mark/magus-mark/actions/workflows/ci.yml/badge.svg" alt="CI Status">
  </a>
  <a href="https://github.com/magus-mark/magus-mark/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/magus-mark/magus-mark" alt="License">
  </a>
</p>

## Overview

Magus Mark provides intelligent tagging and organization for AI chat exports and technical knowledge, with a focus on
making your knowledge base more searchable and navigable. The system implements a carefully designed taxonomy with fixed
categories to ensure tag consistency and utility.

### Key Features

- **AI-Powered Tagging**: Automatically analyze and tag conversations with consistent, meaningful tags
- **Cross-Platform Integration**: Works in Obsidian, VS Code, Cursor, and via CLI
- **Hierarchical Tag System**: Sophisticated classification system with hierarchical taxonomies
- **Cost Management**: Control API usage with budget limits and optimization
- **Customizable**: Configure tagging behavior, models, and taxonomy

## Components

Magus Mark is a suite of tools that work together:

### 1. Core Tagging Engine

The shared core library that powers all components:

- Sophisticated classification system with hierarchical taxonomies
- Precision-engineered prompts for OpenAI integration
- Optimized token usage for cost efficiency

### 2. Obsidian Plugin

Seamless integration with Obsidian:

- Tag documents directly within Obsidian
- Manage tags through a dedicated interface
- Visualize knowledge connections
- [Learn more about the Obsidian Plugin](apps/obsidian-plugin/README.md)

### 3. VS Code Extension

Integration with VS Code and Cursor:

- Connect VS Code with your Obsidian vaults
- Special integration with Cursor AI
- Tag code snippets and conversations
- Knowledge retrieval based on coding context
- [Learn more about the VS Code Extension](apps/vscode/README.md)

### 4. Command Line Interface

Process files and directories from the command line:

- Batch processing capabilities
- Interactive and scriptable modes
- Advanced cost management
- Performance benchmarking
- [Learn more about the CLI](apps/cli/README.md)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (for workspace management)
- OpenAI API key

### Installation

#### Development Setup

```bash
# Clone the repository
git clone https://github.com/magus-mark/magus-mark.git
cd magus-mark

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

#### Component Installation

- **Obsidian Plugin**: Install from Obsidian Community Plugins or manually
- **VS Code Extension**: Install from VS Code Marketplace or manually
- **CLI Tool**: Install via npm or use from source

See individual component READMEs for detailed installation instructions.

## Development

This project uses a modern TypeScript workspace with pnpm, ESLint flat config, and project references:

```bash
# Build all components
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Build specific component
pnpm --filter @magus-mark/core build
```

### CI/CD Pipelines

The project uses GitHub Actions for CI/CD:

- Component-specific CI workflows in `apps/<component>/.github/workflows/`
- Repository-level workflows in `.github/workflows/`
- Automated release process for all components
- Accessibility testing for UI components

## Documentation

For detailed documentation, see:

- [Project Overview](documentation/README.md)
- [Core Tagging Model](documentation/core/tagging-model.md)
- [Implementation Details](documentation/implementation/project-structure.md)
- [CI/CD Workflows](documentation/implementation/ci-cd-workflows.md)

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the Obsidian Plugin API and VS Code Extension API
- Powered by OpenAI's language models
- Inspired by the needs of knowledge workers and developers
