# Project Structure & Implementation

This document outlines the technical project structure for the Obsidian Magic system.

## Repository Structure

The project uses a modern TypeScript (5.8.3) workspace with pnpm, ESLint flat config, and project references:

```
obsidian-magic/
├── .vscode/                 # VS Code configuration
│   ├── settings.json        # Editor settings
│   ├── extensions.json      # Recommended extensions
│   ├── tasks.json           # Build tasks
│   └── launch.json          # Debug configurations
├── .github/                 # GitHub configuration
│   └── workflows/           # GitHub Actions
│       ├── ci.yml           # Continuous integration
│       └── release.yml      # Release automation
├── .cursor/                 # Cursor AI configuration
│   └── rules/               # Custom rules for Cursor AI
├── apps/                    # Application implementations
│   ├── cli/                 # Command-line application
│   │   ├── package.json     # CLI-specific dependencies
│   │   ├── tsconfig.json    # CLI TypeScript config
│   │   ├── src/             # CLI source code
│   │   │   ├── index.ts     # Entry point
│   │   │   ├── commands/    # CLI command definitions
│   │   │   └── utils/       # CLI utilities
│   │   └── tests/           # CLI tests
│   ├── obsidian-plugin/     # Obsidian plugin
│   │   ├── package.json     # Plugin-specific dependencies
│   │   ├── tsconfig.json    # Plugin TypeScript config
│   │   ├── src/             # Plugin source code
│   │   │   ├── main.ts      # Entry point
│   │   │   ├── ui/          # UI components
│   │   │   └── services/    # Plugin services
│   │   └── tests/           # Plugin tests
│   └── vscode/              # VS Code extension
│       ├── package.json     # Extension-specific dependencies
│       ├── tsconfig.json    # Extension TypeScript config
│       ├── src/             # Extension source code
│       │   ├── extension.ts # Entry point
│       │   ├── views/       # View implementations
│       │   └── cursor/      # Cursor-specific code
│       └── tests/           # Extension tests
├── packages/                # Shared packages (publishable)
│   ├── core/                # Core library package
│   │   ├── package.json     # Core package configuration
│   │   ├── tsconfig.json    # Core TypeScript config
│   │   ├── src/             # Core source code
│   │   │   ├── index.ts     # Package entry point
│   │   │   ├── tagging/     # Tag processing logic
│   │   │   ├── openai/      # OpenAI integration
│   │   │   └── markdown/    # Markdown parsing/writing
│   │   └── tests/           # Core package tests
│   ├── types/               # Shared type definitions
│   │   ├── package.json     # Types package config
│   │   ├── tsconfig.json    # Types TypeScript config
│   │   └── src/             # Type definitions
│   └── utils/               # Shared utilities
│       ├── package.json     # Utils package config
│       ├── tsconfig.json    # Utils TypeScript config
│       ├── src/             # Utils source code
│       └── tests/           # Utils tests
├── .env                     # Environment variables (gitignored)
├── .gitignore               # Git ignore file
├── documentation/           # Project documentation
│   ├── implementation/      # Implementation details
│   ├── cli/                 # CLI documentation
│   ├── obsidian-plugin/     # Plugin documentation
│   ├── core/                # Core documentation
│   └── README.md            # Documentation index
├── prompts/                 # OpenAI prompt templates
│   ├── classification.txt   # Classification prompt
│   └── summarization.txt    # Summarization prompt
├── config/                  # Configuration files
│   ├── tags/                # Tag taxonomy definitions
│   │   ├── domains.json     # Domain definitions
│   │   ├── subdomains.json  # Subdomain definitions
│   │   └── wildcards.json   # Wildcard tag suggestions
│   └── default-tags.ts      # Default tag configurations
├── pnpm-workspace.yaml      # Workspace definition
├── package.json             # Root package configuration
├── tsconfig.base.json       # Base TypeScript configuration
├── tsconfig.json            # Root TypeScript configuration
├── eslint.config.js         # ESLint flat configuration
├── prettier.config.js       # Prettier configuration
├── LICENSE                  # Project license
└── README.md                # Project README
```

## Workspace Architecture

The project implements a modular workspace architecture with the following structure:

- **Workspace Root**: Contains shared configurations and workspace setup
  - Root package.json for common dev dependencies
  - Shared configurations (TypeScript, ESLint, Prettier)
  - Workspace configuration (pnpm-workspace.yaml)

- **Apps**: Individual applications with their own configurations
  - CLI Application
  - Obsidian Plugin
  - VS Code Extension
  - Each has dedicated package.json, tsconfig.json, and tests

- **Packages**: Shared libraries (potentially publishable)
  - Core: Business logic shared across apps
  - Types: Shared type definitions
  - Utils: Common utilities and helpers
  - Each package has its own package.json, tsconfig.json, and tests

- **Documentation**: Comprehensive project documentation
  - Implementation details
  - Usage guides
  - API references

## Dependency Management

The project uses pnpm workspaces for dependency management with the following principles:

- Root dependencies are development tools (TypeScript, ESLint, etc.)
- Each app/package has its own dependencies
- Workspace packages reference each other using workspace: protocol
- Consistent versioning across the workspace

## Build Configuration

TypeScript project references are used for efficient, targeted builds:

- tsconfig.base.json provides common compiler options
- Each app/package has its own tsconfig.json that extends the base
- Root tsconfig.json includes references to all project configs
- Incremental builds supported through project references

## Related Implementation Documentation

For detailed information on specific implementation aspects, refer to these additional documents:

- [Build System](../implementation/build-system.md)
- [Testing Strategy](../implementation/testing-strategy.md)
- [Error Handling](../implementation/error-handling.md)
- [Type Safety](../implementation/type-safety.md)
- [Dependency Injection](../implementation/dependency-injection.md) 