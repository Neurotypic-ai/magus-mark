# Contributing to Magus Mark

First off, thank you for considering contributing to Magus Mark! This document provides guidelines and instructions for
contributing to the project.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Bug reports help us improve the project. When you create a bug report, please include as many details as possible:

1. **Use a clear and descriptive title**
2. **Describe the exact steps to reproduce the problem**
3. **Provide specific examples**
4. **Describe the behavior you observed**
5. **Explain the behavior you expected**
6. **Include screenshots and animated GIFs if possible**
7. **Include details about your environment**

### Suggesting Enhancements

Enhancement suggestions help us prioritize features. When suggesting enhancements:

1. **Use a clear and descriptive title**
2. **Provide a detailed description of the suggested enhancement**
3. **Explain why this enhancement would be useful**
4. **List the steps or points that should be addressed**

### Pull Requests

1. **Fork the repository**
2. **Clone your fork locally**
3. **Create a new branch** for your feature or bugfix
4. **Make your changes**
5. **Run tests and ensure CI passes**
6. **Submit a Pull Request**

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)
- [Obsidian](https://obsidian.md/) (for testing Obsidian plugin)

### General Setup

```bash
# Clone the repository
git clone https://github.com/magus-mark/magus-mark.git
cd magus-mark

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Obsidian Plugin Development

For Obsidian plugin development, you'll need to:

1. Build the plugin:

   ```bash
   cd apps/obsidian-plugin
   pnpm run build
   ```

2. For development mode with auto-rebuild:

   ```bash
   pnpm run dev
   ```

3. To link the plugin to your Obsidian vault for testing:

   ```bash
   # Create a symlink to your vault's plugins folder
   mkdir -p /path/to/your/vault/.obsidian/plugins/magus-mark
   ln -s $(pwd)/dist /path/to/your/vault/.obsidian/plugins/magus-mark/
   ln -s $(pwd)/manifest.json /path/to/your/vault/.obsidian/plugins/magus-mark/
   ln -s $(pwd)/styles.css /path/to/your/vault/.obsidian/plugins/magus-mark/
   ```

### Quality Assurance Tools

```bash
# Run tests
pnpm run test

# Run accessibility checks
pnpm run check-accessibility

# Analyze bundle size and composition
pnpm run bundle-analysis
```

## Project Structure

The project follows a monorepo structure:

```
magus-mark/
├── apps/                    # Application implementations
│   ├── cli/                 # Command-line application
│   ├── obsidian-plugin/     # Obsidian plugin
│   │   ├── src/             # Source code
│   │   │   ├── main.ts      # Main plugin class
│   │   │   ├── services/    # Core services
│   │   │   └── ui/          # UI components
│   │   ├── tests/           # Tests
│   │   ├── styles.css       # Styles
│   │   ├── manifest.json    # Plugin manifest
│   │   └── package.json     # npm package file
│   └── vscode/              # VS Code extension
├── packages/                # Shared packages
│   ├── core/                # Core library
│   ├── types/               # Shared type definitions
│   └── utils/               # Shared utilities
├── documentation/           # Project documentation
├── config/                  # Configuration files
└── prompts/                 # OpenAI prompt templates
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

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Changes to the build process or tools

Example: `feat(cli): add support for batch processing conversations` or `feat(ui): add tag visualization view`

### Pull Request Process

1. Create a branch from `main` for your changes
2. Make your changes and commit them following the commit message format
3. Push your branch and create a pull request
4. Ensure all CI checks pass
5. Request a review from a maintainer
6. Address any feedback from the review
7. Once approved, your PR will be merged

## Coding Guidelines

### TypeScript Guidelines

- Follow the existing code style and conventions
- Use TypeScript's type system effectively
- Prefer interfaces for public APIs
- Use union types for closed sets of values
- Do not use the `any` type
- Document public APIs with JSDoc comments
- Follow existing naming conventions

### Testing

We use Vitest for testing. Run tests with:

```bash
pnpm run test
```

For coverage reports:

```bash
pnpm run test:coverage
```

#### Types of Tests

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **Accessibility Tests**: Ensure UI components meet accessibility standards

#### Writing Tests

- Place tests next to the code they test or in the `tests/` directory
- Follow the naming convention: `*.test.ts`
- Use descriptive test names that explain what is being tested
- Use mocks for external dependencies

### Documentation

- Update documentation when changing code
- Document new features
- Use clear and concise language
- Follow Markdown best practices
- Update README.md for user-facing changes
- Update inline code documentation
- Add JSDoc comments for public APIs
- Update quick-start guide for significant changes

### Accessibility

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
- Text alternatives for non-text content
- Make content adaptable to different viewing contexts
- Make it easy to distinguish foreground from background
- Make text readable and understandable
- Help users avoid and correct mistakes

## Release Process

The release process is automated through GitHub Actions:

1. Commits to main branch trigger CI workflows
2. Tagging a version triggers the release workflow
3. Release artifacts are automatically published

For Obsidian plugin specific releases:

1. Version bump in manifest.json and package.json
2. Update changelog
3. Create a tag
4. Build and publish the plugin

## Getting Help

If you need help or have questions:

- Open an issue for bug reports or feature requests
- Join our Discord server for discussions
- Check existing documentation and issues first

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
