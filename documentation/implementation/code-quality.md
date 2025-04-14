# Code Quality Standards

This document outlines the code quality standards, tools, and best practices used in the Obsidian Magic project to ensure consistent, maintainable, and high-quality code.

## ESLint Configuration

We use ESLint with a modular configuration structure to enforce code quality standards across all packages and applications.

### Centralized ESLint Configuration

The ESLint configuration is centralized in the `config/eslint` directory with the following structure:

```
config/eslint/
├── base.config.js           # Base configuration for all TypeScript files
├── react.config.js          # React-specific rules
├── node.config.js           # Node.js specific rules
└── main.config.js           # Root configuration that imports and combines configs
```

For configuration details, see:
- [Base ESLint Configuration](../../config/eslint/base.config.js)
- [React ESLint Configuration](../../config/eslint/react.config.js)
- [Node ESLint Configuration](../../config/eslint/node.config.js)
- [Root ESLint Configuration](../../eslint.config.js)

### Package-Level ESLint Configuration

Each package uses a lightweight configuration that references the shared configurations. See [Core Package ESLint Configuration](../../packages/core/eslint.config.js) for an example.

## Prettier Configuration

Prettier is used for consistent code formatting across all files. Our configuration enforces consistent spacing, quotes, and other stylistic elements.

For configuration details, see:
- [Prettier Configuration](../../config/prettier/config.js)
- [Root Prettier Configuration](../../prettier.config.js)

## Git Hooks for Code Quality

Git hooks enforce code quality standards before commits are made.

### Husky and lint-staged

We use Husky for managing Git hooks and lint-staged for running linters on staged files. See:
- [Husky Configuration](../../.husky/pre-commit)
- [Lint-staged Configuration](../../.lintstagedrc.js)

### Commit Message Linting

We use commitlint to enforce a consistent commit message style according to the Conventional Commits standard. See [Commitlint Configuration](../../config/commitlint/config.js) for details.

## Code Quality Best Practices

### General Guidelines

1. **Consistent Formatting**: Always use ESLint and Prettier to format code before committing.
2. **No Disabled Rules**: Don't disable ESLint rules unless absolutely necessary.
3. **No Ignored Errors**: Fix TypeScript and ESLint errors rather than using ignore comments.
4. **Self-Documenting Code**: Write clear code that requires minimal comments.
5. **Proper Error Handling**: Use the project's Result pattern for error handling.

### TypeScript-Specific Guidelines

1. **No `any` Type**: Avoid using the `any` type. Use `unknown` when type is truly unknown.
2. **Explicit Return Types**: Always specify return types for functions and methods.
3. **Interface Over Type**: Prefer interfaces for object shapes that will be implemented or extended.
4. **Readonly Properties**: Use readonly for properties that shouldn't be changed after initialization.
5. **Discriminated Unions**: Use discriminated unions for type-safe handling of different data shapes.

### React-Specific Guidelines

1. **Functional Components**: Use functional components with hooks instead of class components.
2. **Props Typing**: Always type component props using interfaces.
3. **useCallback and useMemo**: Use these hooks to prevent unnecessary re-renders.
4. **Component Organization**: Follow the project's component organization pattern.
5. **Accessibility**: Always ensure components meet WCAG accessibility standards.

## Automated Quality Checks

### Continuous Integration

Our CI pipeline includes steps to verify code quality including linting, type checking, and tests. See our [CI configuration](../../.github/workflows/ci.yml) for implementation details.

### Pull Request Validation

All pull requests must pass linting, type-checking, and tests before being merged:

1. ESLint validation
2. TypeScript type-checking
3. Unit tests
4. Integration tests (where applicable)

## Tools and Extensions

### Recommended VS Code Extensions

For consistent development experience, we recommend these VS Code extensions:

- ESLint
- Prettier
- TypeScript Error Translator
- EditorConfig for VS Code
- Code Spell Checker
- GitLens

See [VS Code workspace settings](../../.vscode/settings.json) and [recommended extensions](../../.vscode/extensions.json) for the complete setup.

### Editor Configuration

We use EditorConfig to maintain consistent editor settings. See [EditorConfig](../../.editorconfig) for the current configuration.

## Metrics and Reporting

### Code Quality Metrics

Our CI pipeline generates code quality metrics reports:

1. **Test Coverage**: Using Jest and Vitest's coverage reporting
2. **Complexity Analysis**: Using ESLint complexity rules
3. **Bundle Size**: For applications and published packages
4. **Dependency Health**: Monitoring outdated, vulnerable, or duplicate dependencies

These metrics are tracked over time to identify trends and areas for improvement. 