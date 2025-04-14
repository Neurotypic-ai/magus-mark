# Nx Integration

## Nx Workspace Configuration

Nx provides centralized build orchestration, caching, and dependency management for the monorepo. This enables efficient, incremental builds and better developer experience.

### Installation

Nx and its TypeScript plugin can be installed using pnpm. See [package.json](../../package.json) for the specific versions used.

### Workspace Configuration

Nx workspace configuration is defined in [nx.json](../../nx.json) in the root directory. This file configures:

- Task runners for build, test, and lint operations
- Caching configuration for faster builds
- Workspace layout and project organization
- Plugin configurations for TypeScript and other tools

### Project Configuration

Each package and application needs a `project.json` file defining its targets and dependencies. These files specify:

- Build configuration and output paths
- Test runners and options
- Linting settings
- Custom commands

Examples:
- [Core Package Project Configuration](../../packages/core/project.json)
- [CLI App Project Configuration](../../apps/cli/project.json)

### Dependency Graph

Nx automatically calculates dependencies based on imports, but you can also explicitly define them in project.json. This enables Nx to:

- Determine the correct build order for packages
- Run operations only on affected packages
- Visualize project dependencies

## Package Generators

Nx generators automate the creation of new packages and applications with consistent configuration.

### Generator Structure

Custom generators are stored in the [tools/generators](../../tools/generators) directory and can be used to create new packages with consistent structure.

### Using the Generator

Once configured, generators can be used with the Nx CLI:

```bash
# Create a new shared package
nx g package utils

# Create a new application
nx g package cli --directory=apps
```

## Nx Commands Reference

Common Nx commands used in the project:

```bash
# Build a specific project
nx build core

# Test a specific project
nx test core

# Run a specific target for all projects
nx run-many --target=lint --all

# Run a target for all affected projects
nx affected --target=test

# Visualize the dependency graph
nx graph

# Check consistency
nx workspace-lint
``` 