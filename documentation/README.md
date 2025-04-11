# OBSIDIAN MAGIC

## Project Overview

Obsidian Magic is a tool for organizing exports of ChatGPT conversations and other AI chat history in Obsidian (a markdown-based knowledge management application). The core functionality is an AI-powered tagging system that analyzes conversations and applies a consistent set of tags to make them easier to search, navigate, and understand.

The project arose from the need to organize large collections of AI chat exports that become difficult to search and reference over time. While previous attempts at automated tagging resulted in too many inconsistent tags that diminished their usefulness, this system implements a carefully designed taxonomy with fixed categories to ensure tag consistency and utility.

## System Components

The system consists of:

1. **[Core Tagging Engine](./core/tagging-model.md)** - A sophisticated classification system with hierarchical taxonomies
2. **[OpenAI Integration](./core/openai-integration.md)** - Precision-engineered prompts for accurate classification
3. **[Command Line Tool](./cli/cli-overview.md)** - A TypeScript CLI for batch processing
4. **[Obsidian Plugin](./obsidian-plugin/plugin-overview.md)** - Deep integration with the Obsidian knowledge management system
5. **[VS Code & Cursor Integration](./vscode-integration/vscode-overview.md)** - Development environment extensions
6. **[Implementation Details](./implementation/project-structure.md)** - Technical implementation specifications

## Key Benefits

- Consistent tagging taxonomy across all conversations
- Balance of automation and human oversight
- Detailed cost management and estimation
- Flexible handling of existing tags
- Seamless integration with Obsidian, VS Code, and Cursor
- Comprehensive visualization and querying capabilities

## Development Areas

Each component can be developed independently by different team members:

| Component | Description | Key Files |
|-----------|-------------|-----------|
| **Core Engine** | Tag taxonomy, classification strategy | `./core/*.md` |
| **CLI Tool** | Command-line interface for batch processing | `./cli/*.md` |
| **Obsidian Plugin** | Obsidian integration and UI | `./obsidian-plugin/*.md` |  
| **VS Code Extension** | VS Code and Cursor integration | `./vscode-integration/*.md` |
| **Implementation** | Project structure, code organization | `./implementation/*.md` |

## Getting Started

For developers joining the project, start by reviewing:

1. First review the [Core Tagging Model](./core/tagging-model.md) to understand the tagging philosophy
2. Then review the documentation for your assigned component
3. Check the [Project Structure](./implementation/project-structure.md) to understand the codebase organization 