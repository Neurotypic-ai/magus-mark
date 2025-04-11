# Obsidian Magic

AI-powered tagging system for organizing ChatGPT conversations and other AI chat history in Obsidian.

## Project Overview

Obsidian Magic is a tool for organizing exports of ChatGPT conversations and other AI chat history in Obsidian (a markdown-based knowledge management application). The core functionality is an AI-powered tagging system that analyzes conversations and applies a consistent set of tags to make them easier to search, navigate, and understand.

## System Components

The system consists of:

- **Core Tagging Engine** - A sophisticated classification system with hierarchical taxonomies
- **OpenAI Integration** - Precision-engineered prompts for accurate classification
- **Command Line Tool** - A TypeScript CLI for batch processing
- **Obsidian Plugin** - Deep integration with the Obsidian knowledge management system
- **VS Code & Cursor Integration** - Development environment extensions

## Repository Structure

```
obsidian-magic/
├── apps/                    # Application implementations
│   ├── cli/                 # Command-line application
│   ├── obsidian-plugin/     # Obsidian plugin
│   └── vscode/              # VS Code extension
├── packages/                # Shared packages
│   ├── core/                # Core library package
│   ├── types/               # Shared type definitions
│   └── utils/               # Shared utilities
├── documentation/           # Project documentation
├── config/                  # Configuration files
└── prompts/                 # OpenAI prompt templates
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-magic.git
cd obsidian-magic

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the CLI
pnpm --filter @obsidian-magic/cli start
```

## Development

```bash
# Watch mode for development
pnpm dev

# Run tests
pnpm test

# Lint files
pnpm lint

# Format files
pnpm format
```

## License

MIT
