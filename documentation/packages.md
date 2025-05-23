# Packages Documentation

This directory contains the shared packages and libraries for the Magus Mark project. These packages provide reusable
functionality across the various applications.

## Packages Overview

| Package           | Name                            | Description                                   | Type        |
| ----------------- | ------------------------------- | --------------------------------------------- | ----------- |
| Core              | `@magus-mark/core`              | Core tagging engine and shared business logic | Library     |
| TypeScript Viewer | `magus-typescript-viewer`       | TypeScript codebase visualization tool        | Application |
| Nx Plugin         | `@magus-mark/nx-magus`          | Nx plugin for workspace management            | Plugin      |
| ESLint Config     | `@magus-mark/eslint-config`     | Shared ESLint configurations                  | Config      |
| TypeScript Config | `@magus-mark/typescript-config` | Shared TypeScript configurations              | Config      |

## Core Package

**Package:** `@magus-mark/core`  
**Location:** `packages/core/`  
**Type:** Private library package

### Overview

The core package contains all the shared business logic, AI integration, and fundamental functionality that powers the
Magus Mark ecosystem. It's designed to be platform-agnostic and can be used by any application.

### Key Features

- **Tagging Engine**: AI-powered tag classification system
- **OpenAI Integration**: Structured API calls with retry logic
- **Markdown Processing**: Parse and manipulate markdown frontmatter
- **Error Handling**: Result pattern implementation
- **Configuration Management**: Centralized configuration system
- **Token Management**: Track and optimize token usage

### Core Modules

- **Models**: Tag definitions, conversation models, configuration schemas
- **OpenAI**: API client, prompt management, token counting
- **Tagging**: Classification engine, tag graph construction
- **Markdown**: Frontmatter parsing, YAML manipulation
- **Utils**: File operations, string manipulation, path utilities
- **Validators**: Input validation, schema validation with Zod
- **Errors**: Custom error types, error handling utilities

### Dependencies

- **OpenAI SDK** - Official OpenAI API client
- **Zod** - Schema validation and type inference
- **js-tiktoken** - Token counting for cost estimation
- **fs-extra** - Enhanced file system operations
- **Chalk** - Console output styling
- **Ora** - Loading spinners
- **Boxen** - Styled message boxes

### Architecture

```
packages/core/
├── src/
│   ├── errors/          # Custom error types
│   ├── examples/        # Example implementations
│   ├── markdown/        # Markdown processing
│   ├── models/          # Domain models
│   ├── openai/          # OpenAI integration
│   ├── tagging/         # Tag classification
│   ├── testing/         # Test utilities and mocks
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── validators/      # Input validation
```

## TypeScript Viewer

**Package:** `magus-typescript-viewer`  
**Location:** `packages/magus-typescript-viewer/`  
**Binary:** `typescript-viewer`

### Overview

A sophisticated visualization tool for analyzing TypeScript codebases. It generates interactive dependency graphs and
provides insights into code structure and relationships.

### Key Features

- **Dependency Graph Visualization**: Interactive graph using React Flow
- **AST Analysis**: Deep code analysis using jscodeshift
- **Database Storage**: DuckDB for efficient data storage
- **Web Interface**: Material-UI based responsive interface
- **Command Line Interface**: CLI for analysis and serving

### Technical Stack

- **Frontend**: React 19, Material-UI, React Flow
- **Backend**: Node.js, DuckDB, Apache Arrow
- **Analysis**: TypeScript Compiler API, jscodeshift, recast
- **Visualization**: dagre layout, elkjs, mermaid support

### Commands

```bash
# Analyze a TypeScript project
typescript-viewer analyze <project-path>

# Start the visualization server
typescript-viewer serve
```

### Architecture

- **Client**: React-based visualization app
- **Server**: Express server with DuckDB backend
- **Parsers**: AST parsers for TypeScript analysis
- **Workers**: Web workers for heavy computations

## Nx Plugin

**Package:** `@magus-mark/nx-magus`  
**Location:** `packages/nx-magus/`  
**Type:** Nx plugin (CommonJS)

### Overview

Custom Nx plugin that provides generators and executors specific to the Magus Mark workspace. It helps maintain
consistency across the monorepo.

### Features

- **Project Generators**: Scaffold new Magus Mark projects
- **Custom Executors**: Build and test executors
- **Workspace Utilities**: Helper functions for Nx tasks

### Generators

- `project` - Generate a new Magus Mark project
  - Supports app, lib, react, and test framework configurations
  - Includes templates for different project types
  - Configures build tools (esbuild, tsc, vite)

### Structure

```
packages/nx-magus/
├── src/
│   ├── generators/      # Code generators
│   │   └── project/     # Project generator
│   ├── executors/       # Custom executors
│   └── index.js         # Main entry point
├── generators.json      # Generator configurations
└── executors.json       # Executor configurations
```

## ESLint Config

**Package:** `@magus-mark/eslint-config`  
**Location:** `packages/eslint-config/`  
**Type:** Shared configuration

### Overview

Centralized ESLint configuration using the new flat config format. Provides consistent linting rules across all packages
and applications.

### Configurations

- **Base Config**: Core JavaScript/TypeScript rules
- **React Config**: React-specific rules
- **Node Config**: Node.js environment rules
- **Test Config**: Testing-specific rules

### Features

- TypeScript ESLint integration
- Import ordering and sorting
- Accessibility rules for React
- Prettier integration
- Custom rules for Magus Mark conventions

## TypeScript Config

**Package:** `@magus-mark/typescript-config`  
**Location:** `packages/typescript-config/`  
**Type:** Shared configuration

### Overview

Shared TypeScript configurations that ensure consistent compilation settings across the workspace. Uses TypeScript
project references for optimal build performance.

### Configurations

- **base.json**: Core TypeScript settings
- **app.json**: Application-specific settings
- **test.json**: Test environment settings
- **settings/**: Additional configuration presets

### Key Settings

- TypeScript 5.8.3 with strict mode
- ES2022 target with ESNext modules
- Project references enabled
- Composite projects for build optimization
- Path mapping for workspace imports

## Common Patterns

All packages follow these patterns:

1. **Module System**: ES modules (`"type": "module"`)
2. **Build Output**: Compiled to `dist/` directory
3. **Type Definitions**: Generated `.d.ts` files
4. **Testing**: Vitest with co-located tests
5. **Linting**: Shared ESLint configuration
6. **Scripts**: Consistent npm scripts across packages

## Development Guidelines

### Package Scripts

```bash
# Common scripts available in most packages
pnpm build      # Build the package
pnpm dev        # Watch mode development
pnpm test       # Run tests
pnpm lint       # Lint code
pnpm typecheck  # Type checking
```

### Adding a New Package

1. Create directory under `packages/`
2. Initialize with appropriate `package.json`
3. Configure TypeScript with extends
4. Add to workspace dependencies
5. Update Nx project configuration

### Package Dependencies

- Internal packages use `workspace:*` protocol
- External dependencies are strictly managed
- Peer dependencies for framework-specific packages
- Dev dependencies shared via workspace

## Architecture Principles

1. **Single Responsibility**: Each package has a focused purpose
2. **Platform Agnostic**: Core packages work in any environment
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **Testability**: High test coverage with isolated unit tests
5. **Documentation**: Comprehensive JSDoc and type documentation

## Future Packages

Potential packages under consideration:

- **@magus-mark/ui**: Shared React component library
- **@magus-mark/api-client**: TypeScript API client
- **@magus-mark/test-utils**: Enhanced testing utilities
- **@magus-mark/schemas**: Shared data schemas and validators
