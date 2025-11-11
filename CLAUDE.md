# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Magus Mark is an AI-powered tagging system for organizing AI conversations and technical knowledge in Obsidian. It
consists of multiple applications (CLI, Obsidian plugin, VS Code extension) sharing a common core library.

## Development Commands

### Building

- `pnpm build` - Build all packages and applications
- `nx build <project-name>` - Build specific project
- `pnpm --filter @magus-mark/core build` - Build specific package

### Testing

- `pnpm test` - Run all tests
- `nx test <project-name>` - Test specific project
- `pnpm --filter @magus-mark/core test:watch` - Watch mode for specific package

### Linting & Type Checking

- `pnpm lint` - Lint all projects
- `pnpm typecheck` - Type check all projects
- `pnpm format` - Format code with Prettier

### Development

- `pnpm obsidian:dev` - Start Obsidian plugin development
- `nx run <project>:dev` - Start development mode for specific project

### Cleaning

- `pnpm clean` - Clean all dist directories
- `pnpm clean:all` - Clean everything including node_modules

## Architecture

### Workspace Structure

- **apps/** - Application implementations (cli, obsidian-plugin, vscode)
- **packages/** - Shared libraries (core, eslint-config, typescript-config, nx-magus, magus-typescript-viewer)
- **config/** - Centralized configuration files
- **documentation/** - Project documentation
- **prompts/** - OpenAI prompt templates

### Core Architecture Patterns

- **Layered Architecture**: Core layer (platform-agnostic), Adapter layer (platform-specific), UI/UX layer
- **Dependency Injection**: Stateless, constructor-injected service classes
- **Observable Pattern**: Services expose observables for UI state propagation
- **Result Pattern**: Error handling using Result pattern in core library

### Key Technologies

- **Build System**: Nx workspace with pnpm
- **Language**: TypeScript 5.9.2 with project references
- **Testing**: Vitest (primary), Mocha (VS Code integration tests)
- **Linting**: ESLint flat config
- **Package Manager**: pnpm with workspace protocol

### Core Package (`@magus-mark/core`)

Contains all shared business logic:

- Tag classification engines with hierarchical taxonomies
- OpenAI API integration with precision-engineered prompts
- Markdown parsing and manipulation
- Configuration management
- Error handling with Result pattern

### Applications

- **CLI** (`@magus-mark/cli`): Command-line interface with Yargs, interactive UI, cost management
- **Obsidian Plugin** (`@magus-mark/obsidian`): Obsidian-specific implementation with vault access
- **VS Code Extension** (`@magus-mark/vscode`): VS Code integration with Cursor AI support and MCP server

## Testing Strategy

- Co-located tests alongside source code
- Shared testing utilities in each package
- Organized mock files for complex dependencies
- Coverage tracking with c8/vitest

## Environment Requirements

- Node.js >= 22
- pnpm >= 10.9.0
- OpenAI API key for tagging functionality

## Nx Commands

This project uses Nx for build orchestration. Common patterns:

- `nx run-many --target=build --all` - Run target across all projects
- `nx run-many --target=test --projects=tag:package` - Run tests for packages only
- `nx graph` - View dependency graph
- `nx affected:build` - Build only affected projects

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e.
  `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the
  workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific
  project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant,
  up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
