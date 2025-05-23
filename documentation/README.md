# MAGUS MARK

## Project Overview

Magus Mark is a tool for organizing AI chat exports and technical knowledge in Obsidian (a markdown-based knowledge
management application). The core functionality is an AI-powered tagging system that analyzes conversations and applies
a consistent set of tags to make them easier to search, navigate, and understand.

The project arose from the need to organize large collections of AI chat exports that become difficult to search and
reference over time. While previous attempts at automated tagging resulted in too many inconsistent tags that diminished
their usefulness, this system implements a carefully designed taxonomy with fixed categories to ensure tag consistency
and utility.

## System Components

The system consists of:

1. **[Core Tagging Engine](./core/tagging-model.md)** - A sophisticated classification system with hierarchical
   taxonomies
2. **[OpenAI Integration](./core/openai-integration.md)** - Precision-engineered prompts for accurate classification
3. **[Command Line Tool](./cli/cli-overview.md)** - A TypeScript CLI for batch processing
4. **[Obsidian Plugin](./obsidian-plugin/plugin-overview.md)** - Deep integration with the Obsidian knowledge management
   system
5. **[VS Code Extension](./vscode-integration/vscode-overview.md)** - Development environment extensions with MCP server
   integration
6. **[Implementation Details](./implementation/project-structure.md)** - Technical implementation specifications

## Project Structure

- **[Applications](./apps.md)** - Detailed documentation for all application implementations (CLI, Obsidian Plugin, VS
  Code Extension)
- **[Packages](./packages.md)** - Shared libraries and configurations (Core, TypeScript Viewer, Nx Plugin, Configs)

## Build System

The project uses a modern build system with:

- **Nx Workspace** - Efficient build orchestration with caching and dependency tracking
- **TypeScript Project References** - Incremental compilation and proper module boundaries
- **Centralized Configuration** - Shared configs in the `config/` directory
- **ESLint Flat Config** - Modern ESLint setup with TypeScript integration
- **Standardized Scripts** - Consistent commands across packages
- **Git Hooks** - Code quality enforcement with pre-commit hooks

## Testing Approach

The project implements a comprehensive testing strategy:

- **Vitest** - Primary testing framework for most packages
- **Mocha** - Used for VS Code extension tests
- **Co-located Tests** - Tests located alongside the source files they test
- **Organized Mocks** - Dedicated mock files for complex dependencies
- **Result Pattern** - Type-safe error handling and testing

## Key Benefits

- Consistent tagging taxonomy across all conversations
- Balance of automation and human oversight
- Detailed cost management and estimation
- Flexible handling of existing tags
- Seamless integration with Obsidian, VS Code, and Cursor
- Comprehensive visualization and querying capabilities
- MCP server integration for enhanced AI capabilities

## Development Areas

Each component can be developed independently by different team members:

| Component             | Description                                 | Key Files                             |
| --------------------- | ------------------------------------------- | ------------------------------------- |
| **Core Engine**       | Tag taxonomy, classification strategy       | `./core/*.md`                         |
| **CLI Tool**          | Command-line interface for batch processing | `./cli/*.md`                          |
| **Obsidian Plugin**   | Obsidian integration and UI                 | `./obsidian-plugin/*.md`              |
| **VS Code Extension** | VS Code and Cursor integration, MCP servers | `./vscode-integration/*.md`           |
| **Implementation**    | Project structure, code organization        | `./implementation/*.md`               |
| **CI/CD**             | Continuous integration and deployment       | `./implementation/ci-cd-workflows.md` |

## Getting Started

For developers joining the project, start by reviewing:

1. First review the [Core Tagging Model](./core/tagging-model.md) to understand the tagging philosophy
2. Then review the documentation for your assigned component
3. Check the [Project Structure](./implementation/project-structure.md) to understand the codebase organization
4. Review the build system and testing approach outlined in this document

## Development Workflow

1. **Setup**:

   ```bash
   # Install dependencies
   pnpm install

   # Build all packages
   nx run-many --target=build
   ```

2. **Development**:

   ```bash
   # Start development mode with watch
   nx run-many --target=dev

   # Run specific package in dev mode
   nx dev <package-name>
   ```

3. **Testing**:

   ```bash
   # Run all tests
   nx run-many --target=test

   # Run tests for specific package
   nx test <package-name>

   # Run tests in watch mode
   nx test <package-name> --watch
   ```

4. **Linting**:

   ```bash
   # Lint all packages
   nx run-many --target=lint

   # Lint specific package
   nx lint <package-name>
   ```

5. **Building**:
   ```bash
   # Build production versions
   nx run-many --target=build --production
   ```
