# Nx Integration

## Nx Workspace with Inferred Targets

Obsidian Magic utilizes Nx for efficient build orchestration, caching, and dependency management within the pnpm
monorepo. We specifically use Nx's **inferred targets** capability, meaning project tasks (build, test, lint, etc.) are
defined directly in each package's `package.json` scripts, and Nx automatically discovers and runs them.

This approach avoids the need for separate `project.json` files in each package, simplifying configuration.

### Installation

Nx is included as a dev dependency in the root `package.json`. Key packages include `nx` and potentially plugins like
`@nx/js` or `@nx/eslint` if specific features are used.

### Workspace Configuration (`nx.json`)

Nx workspace configuration is defined in `nx.json` in the root directory. This file configures:

- **Target Defaults (`targetDefaults`)**: Defines default configurations and dependencies for common tasks like `build`,
  `test`, and `lint`. For example, ensuring `build` depends on the `build` target of its dependencies (`^build`).
- **Task Runners (`tasksRunnerOptions`)**: Configures the default Nx task runner, enabling caching
  (`cacheableOperations`).
- **Affected Script**: Configuration for running tasks only on projects affected by changes (`nx affected`).
- **Plugins**: Configuration for any Nx plugins used (though we primarily rely on inferred targets).

See [nx.json](../../nx.json) for the specific configuration.

### Project Configuration (via `package.json`)

Instead of `project.json`, individual project tasks are defined in the `scripts` section of each package's
`package.json`. Nx infers these scripts as runnable targets.

Example (`packages/core/package.json`):

```json
{
  "name": "@obsidian-magic/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.lib.json",
    "test": "vitest run --config ./vitest.config.ts",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
  // ... dependencies
}
```

Nx recognizes `build`, `test`, `lint`, and `typecheck` as targets for the `@obsidian-magic/core` project.

### Dependency Graph

Nx automatically analyzes `import` statements to build the project dependency graph. This graph is crucial for:

- Determining the correct build order.
- Running operations only on affected projects (`nx affected ...`).
- Visualizing project dependencies (`nx graph`).

## Nx Commands Reference

Common Nx commands used in the project:

```bash
# Build a specific project (name from package.json)
nx build core

# Test a specific project
nx test core

# Lint a specific project
nx lint core

# Run a specific target for all projects
nx run-many --target=lint

# Run a target only for projects affected by current changes
nx affected --target=test

# Visualize the project dependency graph (opens in browser)
nx graph

# Check for workspace inconsistencies (linting nx.json, etc.)
nx workspace-lint

# Format code using Prettier configuration
nx format:check
nx format:write
```

Refer to the [Nx Documentation](https://nx.dev/getting-started/intro) for more detailed command usage.

## Package Generators

While the initial setup included plans for Nx generators (`build-setup-ideas.md`), custom generators in
`tools/generators` have not been implemented yet. New packages are currently created manually, following the structure
of existing packages.
