# Project Structure

This document outlines the project structure of Obsidian Magic, explaining the organization of packages, files, and key
directories.

## Repository Structure

Obsidian Magic is organized as a monorepo using pnpm workspaces and Nx for build orchestration. The repository is
structured as follows:

```
obsidian-magic/
├── apps/                    # Application packages
│   ├── cli/                 # Command-line interface
│   ├── obsidian-plugin/     # Obsidian plugin integration
│   └── vscode/              # VS Code extension with MCP server
├── packages/                # Library packages
│   ├── core/                # Core functionality and shared logic
│   ├── types/               # Shared type definitions
│   ├── testing/             # Test utilities and mocks
│   └── utils/               # Utility functions and helpers
├── config/                  # Shared configuration
│   ├── eslint/              # ESLint configurations
│   ├── typescript/          # TypeScript configurations
│   └── vitest/              # Vitest configurations
├── .cursor/                 # Cursor AI rules
│   └── rules/               # Project rules for AI assistance
├── documentation/           # Project documentation
│   ├── cli/                 # CLI documentation
│   ├── core/                # Core documentation
│   ├── implementation/      # Implementation details
│   ├── obsidian-plugin/     # Plugin documentation
│   └── vscode-integration/  # VS Code extension documentation
├── prompts/                 # OpenAI prompt templates
└── .specstory/              # Project history and specifications
    └── history/             # Historical project updates
```

## Layered Architecture & Service Instantiation

- All business logic resides in stateless, constructor-injected service classes; no singletons or global registries.
- Core Layer (`@obsidian-magic/core`): Pure, platform-agnostic logic for tag graph algorithms, frontmatter parsing, and
  file processing.
- Adapter Layer (Obsidian, CLI, VSCode): Transforms platform-specific I/O (vault, filesystem, metadata) into core data
  structures.
- UI/UX Handler Layer (Obsidian Plugin): Dedicated handler classes subscribe to service observables (e.g., `status$`,
  `progress$`, `results$`) and update UI components.
- Services expose observables for state propagation, enabling decoupled, testable UI logic.
- Instantiate services per-use with constructor injection, passing all dependencies (API keys, models, config) as
  read-only parameters.

## Package Organization

### Applications

#### CLI (`apps/cli`)

The command-line interface for Obsidian Magic, allowing users to interact with tagging functionality from the terminal.

```
apps/cli/
├── src/
│   ├── commands/           # Command implementations
│   │   ├── tag-command.ts
│   │   └── tag-command.test.ts # Co-located tests
│   ├── services/           # CLI-specific services
│   │   ├── cli-service.ts
│   │   └── cli-service.test.ts
│   └── utils/              # CLI utilities
├── tsconfig.json           # TS config with references
├── tsconfig.lib.json       # Production build config
├── tsconfig.test.json      # Test build config
├── vitest.config.ts        # Vitest configuration
└── package.json            # Package dependencies and scripts
```

#### Obsidian Plugin (`apps/obsidian-plugin`)

The Obsidian plugin implementation for integrating tagging functionality into Obsidian.

```
apps/obsidian-plugin/
├── src/
│   ├── components/         # UI components specific to Obsidian
│   │   ├── TagEditor.tsx
│   │   └── TagEditor.test.tsx
│   ├── services/           # Plugin-specific services
│   │   ├── obsidian-service.ts
│   │   └── obsidian-service.test.ts
│   ├── main.ts             # Plugin entry point
│   └── manifest.json       # Plugin manifest
├── tsconfig.json           # TS config with references
├── tsconfig.lib.json       # Production build config
├── tsconfig.test.json      # Test build config
├── vitest.config.ts        # Vitest configuration
└── package.json            # Package dependencies and scripts
```

#### VS Code Extension (`apps/vscode`)

The VS Code extension for integrating tagging functionality with MCP server capabilities.

```text
apps/vscode/
├── src/
│   ├── commands/           # Extension commands
│   │   ├── tag-command.ts
│   │   └── tag-command.test.ts # Currently Vitest tests
│   ├── providers/          # VS Code providers
│   │   ├── tag-provider.ts
│   │   └── tag-provider.test.ts
│   ├── mcp/                # Model Context Protocol server
│   │   ├── server.ts       # MCP server implementation
│   │   ├── tools/          # Tool implementations
│   │   │   ├── tag-tool.ts
│   │   │   └── content-tool.ts
│   │   └── context/        # Context management
│   ├── extension.ts        # Extension entry point
│   └── extension.test.ts   # Mocha integration tests
├── .mocharc.js             # Mocha configuration
├── tsconfig.json           # TS config with references
├── tsconfig.lib.json       # Production build config
├── tsconfig.test.json      # Test build config
├── vitest.config.ts        # Vitest configuration (unit tests)
└── package.json            # Package dependencies and scripts
```

### Library Packages

#### Core (`packages/core`)

Core functionality and shared logic used across multiple applications.

```text
packages/core/
├── src/
│   ├── config/             # Configuration management
│   │   ├── config.ts
│   │   └── config.test.ts
│   ├── errors/             # Error handling and Result pattern
│   │   ├── result.ts
│   │   └── result.test.ts
│   ├── logger/             # Logging utilities
│   │   ├── logger.ts
│   │   └── logger.test.ts
│   ├── markdown/           # Markdown parsing
│   │   ├── parser.ts
│   │   └── parser.test.ts
│   ├── openai/             # OpenAI integration
│   │   ├── client.ts
│   │   └── client.test.ts
│   ├── tagging/            # Content tagging and classification
│   │   ├── classifier.ts
│   │   └── classifier.test.ts
│   └── index.ts            # Package exports
├── tsconfig.json           # TS config with references
├── tsconfig.lib.json       # Production build config
├── tsconfig.test.json      # Test build config
├── vitest.config.ts        # Vitest configuration
└── package.json            # Package dependencies and scripts
```

#### Types (`packages/types`)

Shared type definitions used across all packages.

```text
packages/types/
├── src/
│   ├── config/             # Configuration types
│   ├── tagging/            # Tagging-related types
│   ├── openai/             # OpenAI-related types
│   ├── errors/             # Error and Result types
│   └── index.ts            # Package exports
├── tsconfig.json           # TS config with references
├── tsconfig.lib.json       # Production build config
└── package.json            # Package dependencies and scripts
```

#### Testing (`packages/testing`)

Testing utilities and mocks for consistent testing across packages.

```text
packages/testing/
├── src/
│   ├── mocks/              # Shared mock implementations
│   │   ├── config.ts       # Configuration mocks
│   │   ├── openai.ts       # OpenAI mocks
│   │   └── logger.ts       # Logger mocks
│   ├── factories/          # Test data factories
│   │   ├── tag-factory.ts  # Tag data factory
│   │   └── config-factory.ts # Configuration factory
│   ├── assertions/         # Custom test assertions
│   └── index.ts            # Package exports
├── tsconfig.json           # TS config with references
├── tsconfig.lib.json       # Production build config
└── package.json            # Package dependencies and scripts
```

#### Utils (`packages/utils`)

Utility functions and helpers used across multiple packages.

```text
packages/utils/
├── src/
│   ├── file/               # File handling utilities
│   │   ├── file-utils.ts
│   │   └── file-utils.test.ts
│   ├── string/             # String manipulation utilities
│   │   ├── string-utils.ts
│   │   └── string-utils.test.ts
│   ├── date/               # Date utilities
│   │   ├── date-utils.ts
│   │   └── date-utils.test.ts
│   └── index.ts            # Package exports
├── tsconfig.json           # TS config with references
├── tsconfig.lib.json       # Production build config
├── tsconfig.test.json      # Test build config
├── vitest.config.ts        # Vitest configuration
└── package.json            # Package dependencies and scripts
```

## Configuration Organization

### Centralized Configuration

Configuration is centralized in the `config/` directory:

```text
config/
├── typescript/
│   ├── base.json           # Base TypeScript configuration
│   ├── library.json        # Library package configuration
│   └── test.json           # Test configuration
├── eslint/
│   ├── base.js             # Base ESLint configuration
│   └── react.js            # React-specific configuration
└── vitest/
    ├── base.ts             # Base Vitest configuration
    └── react.ts            # React-specific test configuration
```

Each package extends these base configurations in their local config files.

### TypeScript Project References

The project uses TypeScript project references for efficient builds:

```text
// Root tsconfig.json
{
  "references": [
    { "path": "./packages/types" },
    { "path": "./packages/utils" },
    { "path": "./packages/core" },
    { "path": "./packages/testing" },
    { "path": "./apps/cli" },
    { "path": "./apps/obsidian-plugin" },
    { "path": "./apps/vscode" }
  ]
}

// Package tsconfig.json
{
  "extends": "../../config/typescript/base.json",
  "references": [
    { "path": "../types" }
  ]
}
```

### Nx Workspace Configuration

The project uses Nx with inferred targets for build orchestration:

```text
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {
      "dependsOn": []
    }
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  }
}
```

## Documentation Organization

Documentation is organized in the `documentation` directory:

```text
documentation/
├── cli/                    # CLI documentation
│   ├── cli-overview.md
│   ├── command-structure.md
│   └── workflow-orchestration.md
├── core/                   # Core documentation
│   ├── tagging-model.md
│   └── openai-integration.md
├── implementation/         # Implementation documentation
│   ├── project-structure.md
│   ├── build-system.md
│   ├── testing-strategy.md
│   └── error-handling.md
├── obsidian-plugin/        # Obsidian plugin documentation
│   └── plugin-overview.md
├── vscode-integration/     # VS Code integration documentation
│   └── vscode-overview.md
└── README.md               # Documentation overview
```

## Key Files

### Root Configuration Files

- `package.json`: Root package configuration for the monorepo
- `pnpm-workspace.yaml`: pnpm workspace configuration
- `nx.json`: Nx configuration with inferred targets
- `tsconfig.json`: Root TypeScript configuration with project references
- `eslint.config.js`: ESLint flat configuration
- `prettier.config.js`: Prettier configuration
- `.gitignore`: Git ignore file
- `.github/workflows/`: GitHub Actions CI/CD workflows

### Package Configuration Files

Each package contains the following key configuration files:

- `package.json`: Package dependencies and scripts
- `tsconfig.json`: TS config with project references
- `tsconfig.lib.json`: Production build configuration
- `tsconfig.test.json`: Test configuration
- `vitest.config.ts`: Test runner configuration

## Testing Strategy

The project implements a robust testing strategy:

- **Co-located Tests**: Test files are placed next to the files they test
- **Vitest**: Primary testing framework for most packages
- **Mocha**: Used for VS Code extension integration tests
- **Testing Package**: Shared mocks and test utilities
- **Result Pattern**: Consistent error handling and testing

## Build System

The project uses an Nx-based build system with:

- **Nx Commands**: `nx build`, `nx test`, `nx lint`
- **TypeScript Project References**: Incremental builds
- **Centralized Configuration**: Shared configs in `config/`
- **Git Hooks**: Pre-commit linting with Husky and lint-staged

## More Information

For more detailed information on specific aspects of the project architecture, refer to the following documents:

- [Build System](./build-system.md)
- [Testing Strategy](./testing-strategy.md)
- [Error Handling](./error-handling.md)
- [CI/CD Workflows](./ci-cd-workflows.md)
