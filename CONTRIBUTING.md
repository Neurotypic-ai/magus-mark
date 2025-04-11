# Contributing to Obsidian Magic

First off, thank you for considering contributing to Obsidian Magic! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

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

The project uses pnpm workspaces and TypeScript project references:

```bash
# Clone the repository
git clone https://github.com/obsidian-magic/obsidian-magic.git
cd obsidian-magic

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

The project follows a monorepo structure:

- `apps/` - Application implementations
  - `cli/` - Command-line application
  - `obsidian-plugin/` - Obsidian plugin
  - `vscode/` - VS Code extension
- `packages/` - Shared packages
  - `core/` - Core library
  - `types/` - Shared type definitions
  - `utils/` - Shared utilities
- `documentation/` - Project documentation
- `config/` - Configuration files
- `prompts/` - OpenAI prompt templates

## Coding Guidelines

### TypeScript Guidelines

- Follow the existing code style and conventions
- Use TypeScript's type system effectively
- Prefer interfaces for public APIs
- Use union types for closed sets of values
- Minimize use of `any` type
- Document public APIs with JSDoc comments
- Follow existing naming conventions

### Testing

- Write tests for new features and bug fixes
- Run the full test suite before submitting PRs
- Follow the existing testing patterns
- Aim for high test coverage of critical paths

### Documentation

- Update documentation when changing code
- Document new features
- Use clear and concise language
- Follow Markdown best practices

### Accessibility

- Follow WCAG 2.1 AA standards for UI components
- Ensure keyboard navigability
- Use semantic HTML where appropriate
- Provide text alternatives for non-text content
- Ensure sufficient color contrast

## Commit Messages

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

Example: `feat(cli): add support for batch processing conversations`

## Pull Request Process

1. Update documentation if necessary
2. Update tests if necessary
3. Include a clear description of the changes
4. Link to any relevant issues
5. Ensure all checks pass
6. Request review from maintainers

## Release Process

The release process is automated through GitHub Actions:

1. Commits to main branch trigger CI workflows
2. Tagging a version triggers the release workflow
3. Release artifacts are automatically published

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License. 