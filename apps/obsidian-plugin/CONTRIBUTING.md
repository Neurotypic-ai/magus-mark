# Contributing to Obsidian Magic

Thank you for your interest in contributing to Obsidian Magic! This document provides guidelines and instructions for
contributing to the project.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Obsidian](https://obsidian.md/) (for testing)

### Development Environment Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/obsidian-magic/obsidian-magic.git
   cd obsidian-magic
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the plugin:

   ```bash
   cd apps/obsidian-plugin
   pnpm run build
   ```

4. For development mode with auto-rebuild:

   ```bash
   pnpm run dev
   ```

5. To link the plugin to your Obsidian vault for testing:

   ```bash
   # Create a symlink to your vault's plugins folder
   mkdir -p /path/to/your/vault/.obsidian/plugins/obsidian-magic
   ln -s $(pwd)/dist /path/to/your/vault/.obsidian/plugins/obsidian-magic/
   ln -s $(pwd)/manifest.json /path/to/your/vault/.obsidian/plugins/obsidian-magic/
   ln -s $(pwd)/styles.css /path/to/your/vault/.obsidian/plugins/obsidian-magic/
   ```

6. Quality assurance tools:

   ```bash
   # Run tests
   pnpm run test

   # Run accessibility checks
   pnpm run check-accessibility

   # Analyze bundle size and composition
   pnpm run bundle-analysis
   ```

## Project Structure

```
obsidian-magic/apps/obsidian-plugin/
├── src/                    # Source code
│   ├── main.ts             # Main plugin class
│   ├── services/           # Core services
│   └── ui/                 # UI components
├── tests/                  # Tests
├── styles.css              # Styles
├── manifest.json           # Plugin manifest
└── package.json            # npm package file
```

## Development Workflow

### Branch Naming

- Use descriptive branch names with prefixes:
  - `feature/` for new features
  - `fix/` for bug fixes
  - `docs/` for documentation changes
  - `refactor/` for code refactoring
  - `test/` for adding tests
  - `chore/` for routine tasks

Example: `feature/tag-visualization`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or modifying tests
- `chore`: Changes to the build process or auxiliary tools

Example: `feat(ui): add tag visualization view`

### Pull Request Process

1. Create a branch from `main` for your changes
2. Make your changes and commit them following the commit message format
3. Push your branch and create a pull request
4. Ensure all CI checks pass
5. Request a review from a maintainer
6. Address any feedback from the review
7. Once approved, your PR will be merged

## Testing

We use Vitest for testing. Run tests with:

```bash
pnpm run test
```

For coverage reports:

```bash
pnpm run test:coverage
```

### Types of Tests

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **Accessibility Tests**: Ensure UI components meet accessibility standards

### Writing Tests

- Place tests next to the code they test or in the `tests/` directory
- Follow the naming convention: `*.test.ts`
- Use descriptive test names that explain what is being tested
- Use mocks for external dependencies

## Code Style and Quality

We use ESLint and TypeScript for code quality. Run the linter with:

```bash
pnpm run lint
```

Check types with:

```bash
pnpm run typecheck
```

### Style Guidelines

- Use TypeScript for all source code
- Follow the existing code style
- Use descriptive variable and function names
- Write meaningful comments for complex logic
- Ensure all code is typed properly
- Follow accessibility best practices for UI components

## Accessibility

All UI components must meet WCAG 2.1 AA standards. Check accessibility with:

```bash
pnpm run check-accessibility
```

Key accessibility requirements:

- Proper semantic HTML
- Sufficient color contrast
- Keyboard navigation
- Screen reader support
- Focus management

## Documentation

Update documentation when adding or changing features:

- Update README.md for user-facing changes
- Update inline code documentation
- Add JSDoc comments for public APIs
- Update quick-start guide for significant changes

## Releasing

Releases are handled by maintainers. The release process includes:

1. Version bump in manifest.json and package.json
2. Update changelog
3. Create a tag
4. Build and publish the plugin

## Getting Help

If you need help or have questions:

- Open an issue for bug reports or feature requests
- Join our Discord server for discussions
- Check existing documentation and issues first

Thank you for contributing to Obsidian Magic!
