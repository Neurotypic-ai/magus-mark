# @magus-mark/typescript-config

Shared TypeScript configurations for Magus Mark projects.

## Usage

Add as a workspace dependency:

```json
"dependencies": {
  "@magus-mark/typescript-config": "workspace:*"
}
```

Then extend the appropriate configuration in your project's `tsconfig.json`:

```json
{
  "extends": "@magus-mark/typescript-config/library.json",
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
  "extends": "@magus-mark/typescript-config/library.json",
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
  "extends": "@magus-mark/typescript-config/cli.json",
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
  "extends": "@magus-mark/typescript-config/obsidian.json",
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
  "extends": "@magus-mark/typescript-config/vscode.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```
