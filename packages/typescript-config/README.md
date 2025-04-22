# tsconfig-custom

Shared TypeScript configurations for Obsidian Magic projects.

## Usage

Add as a workspace dependency:

```json
"dependencies": {
  "tsconfig-custom": "workspace:*"
}
```

Then extend the appropriate configuration in your project's `tsconfig.json`:

```json
{
  "extends": "tsconfig-custom/library.json",
  // Additional project-specific settings
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Available Configurations

- **base.json**: Base configuration with common settings
- **settings.json**: Core TypeScript settings with strict type checking
- **build.json**: Settings for building production code
- **test.json**: Settings for test files
- **app.json**: Base settings for applications
- **library.json**: Settings for library packages (e.g., core)
- **cli.json**: Settings for CLI applications
- **obsidian.json**: Settings for Obsidian plugins
- **vscode.json**: Settings for VS Code extensions

## Project-Specific Configuration Examples

### Core Library

```json
{
  "extends": "tsconfig-custom/library.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationDir": "./dist/types"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### CLI Application

```json
{
  "extends": "tsconfig-custom/cli.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Obsidian Plugin

```json
{
  "extends": "tsconfig-custom/obsidian.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### VS Code Extension

```json
{
  "extends": "tsconfig-custom/vscode.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```
