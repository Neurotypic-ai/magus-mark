# Build System

The project uses a unified build system with specialized configurations for each target:

## CLI Build

- TypeScript compilation with Node.js target
- Bundle dependencies for distribution
- Generate executable with shebang
- Create standalone packages for different platforms

## Obsidian Plugin Build

- Webpack bundling for browser environment
- CSS and asset processing
- Manifest generation
- Package for direct installation or submission to Obsidian community plugins

## VS Code Extension Build

- VS Code extension packaging
- Web extension compatibility
- Extension manifest generation
- Package for direct installation or marketplace submission

## Shared Code

- Type declaration generation
- Documentation generation
- Linting and formatting
- Test coverage reporting

## Build Configuration Files

The project includes several important build configuration files:

```
obsidian-magic/
├── tsconfig.json            # TypeScript base configuration
├── tsconfig.cli.json        # CLI-specific TypeScript config
├── tsconfig.plugin.json     # Plugin-specific TypeScript config
├── config/
│   └── webpack.config.js    # Build configuration
└── scripts/                 # Build and utility scripts
    ├── build.ts             # Build scripts
    └── release.ts           # Release scripts
```

## Build Best Practices

1. **Modular Configurations**:
   - Use inheritance for TypeScript configurations
   - Share common webpack configurations
   - Maintain separate entry points for each target

2. **Optimization**:
   - Configure proper tree shaking for smaller bundles
   - Minimize bundle sizes with appropriate optimizations
   - Use source maps for debugging

3. **Automation**:
   - Use npm scripts for common build tasks
   - Implement GitHub Actions for continuous integration
   - Automate version management and releases 