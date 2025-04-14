# Build System

The project uses a unified monorepo build system with centralized configuration and specialized targets for each application:

## Centralized Configuration Structure

All configuration files are centralized in a dedicated `config` directory, with lightweight importers in the root for tool compatibility.

### Directory Structure

```
obsidian-magic/
├── config/                           # Central configuration directory
│   ├── typescript/                   # TypeScript configurations
│   │   ├── tsconfig.base.json        # Base TS configuration
│   │   └── templates/                # TS configuration templates
│   ├── eslint/                       # ESLint configurations
│   ├── vitest/                       # Test configurations
│   ├── prettier/                     # Formatting configurations
│   └── templates/                    # Project templates
├── packages/                         # Shared packages
│   └── [package]/                    # Each package has:
│       ├── package.json              # Package definition
│       ├── project.json              # Nx targets
│       ├── tsconfig.json             # References lib and test configs
│       ├── tsconfig.lib.json         # Extends from base template
│       └── tsconfig.test.json        # Test configuration
└── apps/                             # Applications
    └── [app]/                        # Similar structure to packages
```

### Root Configuration Files

Lightweight importer files in the root reference configuration in the `config` directory:

- [Root TypeScript Configuration](../../tsconfig.json)
- [Root ESLint Configuration](../../eslint.config.js)
- [Root Prettier Configuration](../../prettier.config.js)

### Benefits of Centralized Configuration

- **Single Source of Truth**: Consistent configuration definitions
- **Easier Updates**: Change a template to affect all packages
- **Better Organization**: Clear separation between templates and instances
- **Developer Experience**: Easy to locate and understand configuration

## Package Scripts Standardization

Each package in the monorepo uses consistent npm scripts through Nx:

- [Root Package.json](../../package.json) - Contains workspace-level scripts
- [Core Package.json](../../packages/core/package.json) - Example of package-level scripts

### Clean Implementation

Safe directory cleaning using Node.js native fs is implemented in [Clean Script](../../tools/scripts/clean.js). This removes build artifacts without risking accidental deletion of source files.

## Production Build Collection

For production builds, artifacts from individual packages are collected into a central location:

- [Distribution Target Configuration](../../packages/core/project.json) - Example of a distribution target
- [Build Aggregation Script](../../tools/scripts/build-all.js) - Handles cleaning, building, and artifact collection

## Application-Specific Builds

Each application type has specialized build configuration:

### CLI App

- TypeScript compilation with Node.js target
- Bundle dependencies for distribution
- Generate executable with shebang
- Create standalone packages for different platforms

See [CLI Build Configuration](../../apps/cli/project.json) for implementation details.

### Obsidian Plugin App

- Webpack bundling for browser environment
- CSS and asset processing
- Manifest generation
- Package for direct installation or submission to Obsidian community plugins

See [Obsidian Plugin Build Configuration](../../apps/obsidian-plugin/project.json) for implementation details.

### VS Code Extension App

- VS Code extension packaging
- Web extension compatibility
- Extension manifest generation
- Package for direct installation or marketplace submission

See [VS Code Extension Build Configuration](../../apps/vscode/project.json) for implementation details.

## Build Best Practices

1. **Modular Configurations**:
   - Inherit TypeScript configurations from base templates
   - Use composition over duplication for build configurations
   - Maintain separate entry points for each target

2. **Optimization**:
   - Configure proper tree shaking for smaller bundles
   - Minimize bundle sizes with appropriate optimizations
   - Use source maps for debugging

3. **Automation**:
   - Use Nx for dependency-aware builds
   - Implement GitHub Actions for continuous integration
   - Automate version management and releases 