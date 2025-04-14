# Project Structure

This document outlines the project structure of Obsidian Magic, explaining the organization of packages, files, and key directories.

## Repository Structure

Obsidian Magic is organized as a monorepo using pnpm workspaces and Nx for build orchestration. The repository is structured as follows:

```
obsidian-magic/
├── apps/                  # Application packages
│   ├── cli/               # Command-line interface
│   ├── desktop/           # Desktop application (Electron)
│   ├── obsidian-plugin/   # Obsidian plugin integration
│   └── vscode-extension/  # VS Code extension
├── packages/              # Library packages
│   ├── core/              # Core functionality and shared logic
│   ├── tagging/           # Tagging and classification services
│   ├── ui/                # Shared UI components
│   └── utils/             # Utility functions and helpers
├── config/                # Shared configuration
│   ├── eslint/            # ESLint configurations
│   ├── jest/              # Jest configurations
│   ├── prettier/          # Prettier configurations
│   ├── tsconfig/          # TypeScript configurations
│   └── vitest/            # Vitest configurations
├── scripts/               # Build and utility scripts
├── documentation/         # Project documentation
│   ├── architecture/      # Architecture documentation
│   ├── api/               # API documentation
│   └── implementation/    # Implementation details
├── e2e/                   # End-to-end tests
└── examples/              # Example usage and configurations
```

## Package Organization

### Applications

#### CLI (`apps/cli`)

The command-line interface for Obsidian Magic, allowing users to interact with magic functionality from the terminal.

```
apps/cli/
├── src/
│   ├── commands/          # Command implementations
│   ├── services/          # CLI-specific services
│   └── utils/             # CLI utilities
├── package.json
└── tsconfig.json
```

#### Desktop App (`apps/desktop`)

The Electron-based desktop application for Obsidian Magic.

```
apps/desktop/
├── src/
│   ├── main/              # Main process code
│   ├── preload/           # Preload scripts
│   └── renderer/          # Renderer process code (UI)
├── package.json
└── tsconfig.json
```

#### Obsidian Plugin (`apps/obsidian-plugin`)

The Obsidian plugin implementation for integrating Magic functionality into Obsidian.

```
apps/obsidian-plugin/
├── src/
│   ├── components/        # UI components specific to Obsidian
│   ├── services/          # Plugin-specific services
│   ├── main.ts            # Plugin entry point
│   └── manifest.json      # Plugin manifest
├── package.json
└── tsconfig.json
```

#### VS Code Extension (`apps/vscode-extension`)

The VS Code extension for integrating Magic functionality into VS Code.

```
apps/vscode-extension/
├── src/
│   ├── commands/          # Extension commands
│   ├── providers/         # VS Code providers
│   └── extension.ts       # Extension entry point
├── package.json
└── tsconfig.json
```

### Library Packages

#### Core (`packages/core`)

Core functionality and shared logic used across multiple applications.

```
packages/core/
├── src/
│   ├── analyzers/         # Content analysis
│   ├── models/            # Core data models
│   ├── parsers/           # Content parsing
│   └── services/          # Core services
├── package.json
└── tsconfig.json
```

#### Tagging (`packages/tagging`)

Tagging and classification services for auto-tagging content.

```
packages/tagging/
├── src/
│   ├── classifiers/       # Content classifiers
│   ├── models/            # Tagging models
│   ├── extractors/        # Key information extractors
│   └── services/          # Tagging services
├── package.json
└── tsconfig.json
```

#### UI (`packages/ui`)

Shared UI components used across multiple applications.

```
packages/ui/
├── src/
│   ├── components/        # UI components
│   ├── hooks/             # React hooks
│   ├── styles/            # Shared styles and themes
│   └── utils/             # UI utilities
├── package.json
└── tsconfig.json
```

#### Utils (`packages/utils`)

Utility functions and helpers used across multiple packages.

```
packages/utils/
├── src/
│   ├── date/              # Date utilities
│   ├── file/              # File handling utilities
│   ├── string/            # String manipulation utilities
│   └── testing/           # Testing utilities
├── package.json
└── tsconfig.json
```

## Configuration Organization

### ESLint Configuration

ESLint configuration is centralized in the `config/eslint` directory:

```
config/eslint/
├── base.js                # Base ESLint configuration
├── react.js               # React-specific ESLint configuration
├── node.js                # Node.js-specific ESLint configuration
└── typescript.js          # TypeScript-specific ESLint configuration
```

### TypeScript Configuration

TypeScript configuration is centralized in the `config/tsconfig` directory:

```
config/tsconfig/
├── base.json              # Base TypeScript configuration
├── react.json             # React-specific TypeScript configuration
├── node.json              # Node.js-specific TypeScript configuration
└── library.json           # Library-specific TypeScript configuration
```

### Prettier Configuration

Prettier configuration is centralized in the `config/prettier` directory:

```
config/prettier/
└── config.js              # Prettier configuration
```

### Jest Configuration

Jest configuration is centralized in the `config/jest` directory:

```
config/jest/
├── base.js                # Base Jest configuration
├── react.js               # React-specific Jest configuration
└── node.js                # Node.js-specific Jest configuration
```

### Vitest Configuration

Vitest configuration is centralized in the `config/vitest` directory:

```
config/vitest/
├── base.config.ts         # Base Vitest configuration
└── react.config.ts        # React-specific Vitest configuration
```

## Documentation Organization

Documentation is organized in the `documentation` directory:

```
documentation/
├── architecture/          # Architecture documentation
│   ├── overview.md        # System overview
│   ├── decisions/         # Architecture decision records
│   └── diagrams/          # Architecture diagrams
├── api/                   # API documentation
│   ├── core/              # Core API documentation
│   └── tagging/           # Tagging API documentation
└── implementation/        # Implementation documentation
    ├── code-quality.md    # Code quality standards
    ├── testing.md         # Testing strategy
    └── project-structure.md # Project structure
```

## Key Files

### Root Configuration Files

- `package.json`: Root package configuration for the monorepo
- `pnpm-workspace.yaml`: pnpm workspace configuration
- `nx.json`: Nx configuration
- `tsconfig.json`: Root TypeScript configuration
- `.eslintrc.js`: Root ESLint configuration
- `.prettierrc.js`: Root Prettier configuration
- `.gitignore`: Git ignore file
- `.github/workflows/`: GitHub Actions CI/CD workflows

### Package Configuration Files

Each package contains the following key configuration files:

- `package.json`: Package metadata and dependencies
- `tsconfig.json`: Package-specific TypeScript configuration
- `README.md`: Package documentation

## Dependency Management

Dependencies are managed using pnpm, with the following organizational principles:

1. **Shared Dependencies**: Common dependencies used across multiple packages are defined in the root `package.json` as devDependencies.
2. **Package-specific Dependencies**: Dependencies used only by a specific package are defined in that package's `package.json`.
3. **Peer Dependencies**: Libraries that should be provided by the consuming application are defined as peerDependencies.

## Build and Execution Flow

The build process is orchestrated using Nx, with the following key targets:

- `build`: Compiles the package
- `test`: Runs tests for the package
- `lint`: Runs ESLint on the package
- `e2e`: Runs end-to-end tests (for application packages)

The dependency graph is managed by Nx, ensuring that packages are built in the correct order.

## Import Conventions

Internal imports follow these conventions:

1. **Absolute Imports**: Packages use absolute imports from the root of the package:
   ```typescript
   // Preferred
   import { parseMarkdown } from 'src/parsers/markdown';
   
   // Avoid
   import { parseMarkdown } from '../../parsers/markdown';
   ```

2. **Inter-package Imports**: Packages import from other packages using their package name:
   ```typescript
   import { parseMarkdown } from '@obsidian-magic/core';
   ```

## Asset Management

Static assets are organized as follows:

```
<package>/
├── src/
│   └── assets/            # Static assets
│       ├── images/        # Image assets
│       ├── styles/        # Style assets
│       └── fonts/         # Font assets
```

## Tests Organization

Tests are co-located with the source code they are testing:

```
<package>/src/
├── feature/
│   ├── feature.ts         # Feature implementation
│   └── feature.test.ts    # Feature tests
```

Integration tests are placed in a `__tests__` directory at the appropriate level:

```
<package>/
├── src/
│   └── feature/
├── __tests__/
│   └── feature-integration.test.ts
```

## Adding New Packages

To add a new package to the monorepo:

1. Create a new directory in the appropriate location (`apps/` or `packages/`).
2. Create a `package.json` file with the appropriate dependencies.
3. Create a `tsconfig.json` file extending from the appropriate base configuration.
4. Update the `pnpm-workspace.yaml` file if needed.
5. Add the package to the Nx configuration if needed.

## Resource and Configuration Sharing

Shared resources and configurations are organized as follows:

1. **Environment Variables**: Environment variables are managed using `.env` files at the root of the repository and in each application package.
2. **Shared Constants**: Shared constants are defined in the `packages/utils` package.
3. **Shared Types**: Shared types are defined in the appropriate packages and exported for use by other packages.

## Scalability Considerations

The project structure is designed to scale with the following considerations:

1. **Modular Architecture**: New functionality can be added by creating new packages or extending existing ones.
2. **Clear Boundaries**: Packages have clear boundaries and responsibilities, making it easier to understand and modify the codebase.
3. **Shared Infrastructure**: Common infrastructure (configuration, testing, etc.) is shared across packages, reducing duplication and maintenance costs.
4. **Dependency Management**: Dependencies are managed at the package level, allowing for fine-grained control over what each package depends on.
