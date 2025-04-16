# Code Quality Standards

This document outlines the code quality standards, tools, and best practices used in the Obsidian Magic project to
ensure consistent, maintainable, and high-quality code.

## ESLint Configuration

We use ESLint with a flat configuration structure (`eslint.config.js` at the root) leveraging shared configurations to
enforce code quality standards across all packages and applications.

### Centralized ESLint Configuration

The ESLint configuration is managed centrally via files within the `config/eslint` directory:

```
config/eslint/
├── base.js           # Base configuration for all TypeScript files
├── react.js          # React-specific rules
└── node.js           # Node.js specific rules (if needed)
```

The root `eslint.config.js` imports and combines these configurations.

For configuration details, see:

- [Base ESLint Configuration](../../config/eslint/base.js)
- [React ESLint Configuration](../../config/eslint/react.js)
- [Root ESLint Configuration](../../eslint.config.js)

## Prettier Configuration

Prettier is used for consistent code formatting across all files. The configuration is defined in `prettier.config.js`
at the project root.

For configuration details, see:

- [Root Prettier Configuration](../../prettier.config.js)

## Git Hooks for Code Quality

Git hooks enforce code quality standards before commits are made.

### Husky and lint-staged

We use Husky for managing Git hooks and lint-staged for running linters and formatters on staged files.

- Husky configuration is typically found in the `.husky/` directory (e.g., `.husky/pre-commit`).
- Lint-staged configuration is in `lint-staged.config.js` or within `package.json`.

### Commit Message Linting

We use commitlint to enforce a consistent commit message style according to the Conventional Commits standard.
Configuration is in `commitlint.config.js`.

## Code Quality Best Practices

### General Guidelines

1. **Consistent Formatting**: Always run `nx format:write` or rely on editor integration before committing.
2. **No Disabled Rules**: Don't disable ESLint rules (e.g., with `// eslint-disable-next-line`) unless absolutely
   necessary and justified with a comment.
3. **No Ignored Errors**: Fix TypeScript (`@ts-expect-error`, `@ts-ignore`) and ESLint errors rather than suppressing
   them.
4. **Self-Documenting Code**: Write clear, readable code with meaningful names that requires minimal explanatory
   comments.
5. **Proper Error Handling**: Consistently use the project's Result pattern (`@obsidian-magic/core/errors`) for error
   handling.

### TypeScript-Specific Guidelines

Refer to the detailed [.cursor/rules/typescript-best-practices.mdc](mdc:.cursor/rules/typescript-best-practices.mdc)
rule for comprehensive TypeScript guidelines, including:

- **No `any` Type**: Avoid using the `any` type. Use `unknown` with type narrowing.
- **Explicit Return Types**: Generally preferred for public APIs and complex functions.
- **Interface vs. Type**: Use interfaces for object shapes that might be extended or implemented; use types for unions,
  intersections, or simple aliases.
- **Readonly Properties**: Use `readonly` where appropriate for immutability.
- **Discriminated Unions**: Use for type-safe handling of variant data structures.

### React-Specific Guidelines

1. **Functional Components**: Use functional components with hooks.
2. **Props Typing**: Always type component props using interfaces or types.
3. **Memoization**: Use `useCallback` and `useMemo` judiciously to optimize performance.
4. **Accessibility**: Ensure components meet WCAG accessibility standards (see
   [.cursor/rules/accessibility-ux.mdc](mdc:.cursor/rules/accessibility-ux.mdc)).

## Automated Quality Checks

### Continuous Integration

Our CI pipeline (`.github/workflows/ci.yml`) includes steps to verify code quality:

- Linting: `nx run-many --target=lint`
- Type Checking: `nx run-many --target=typecheck` (if defined) or as part of `build`
- Testing: `nx run-many --target=test`

### Pull Request Validation

All pull requests must pass these automated checks before being merged.

## Tools and Extensions

### Recommended VS Code Extensions

For a consistent development experience, we recommend these VS Code extensions:

- ESLint
- Prettier - Code formatter
- EditorConfig for VS Code
- Nx Console (Provides UI for Nx commands)
- Code Spell Checker
- GitLens

See [VS Code workspace settings](../../.vscode/settings.json) and
[recommended extensions](../../.vscode/extensions.json) for the complete setup.

### Editor Configuration

We use EditorConfig (`.editorconfig` at root) to maintain consistent editor settings across different editors and IDEs.

## Metrics and Reporting

### Code Quality Metrics

Our CI pipeline can be configured to generate code quality metrics reports:

1. **Test Coverage**: Using Vitest's (`--coverage`) or Mocha's coverage reporting capabilities, potentially uploaded to
   services like Codecov.
2. **Complexity Analysis**: Via ESLint complexity rules.
3. **Bundle Size**: Using `source-map-explorer` for applications.
4. **Dependency Health**: Potentially using tools like `npm outdated` or dedicated vulnerability scanners.
