# CI/CD Workflows

This document describes the continuous integration and continuous deployment (CI/CD) workflows set up for the Obsidian Magic project.

## Overview

Obsidian Magic uses GitHub Actions for CI/CD across all components of the project. The workflows are designed to:

1. Validate code quality through building, linting, and testing
2. Perform automated accessibility checks for UI components
3. Analyze bundle sizes for performance optimization
4. Create deployable packages for each component
5. Automate the release process

## Workflow Structure

The project uses a combination of component-specific workflows and repository-level workflows:

### Repository-Level Workflows

Located in `.github/workflows/`:

- **CI Workflow** (`ci.yml`): Runs on all push and pull request events to the main branch
  - Tests all components with Node.js 18.x and 20.x
  - Performs linting, type checking, building, and testing
  - Ensures all components work together correctly

- **Release Workflow** (`release.yml`): Triggered when a new tag is pushed
  - Builds all components
  - Packages the Obsidian plugin, VS Code extension, and CLI tool
  - Creates a GitHub release with all artifacts
  - Generates release notes from the CHANGELOG

### Component-Specific Workflows

Each component has its own CI workflow in `apps/<component>/.github/workflows/`:

#### Obsidian Plugin

Located in `apps/obsidian-plugin/.github/workflows/ci.yml`:

- Runs on pushes and pull requests affecting the plugin or shared packages
- Tests building, linting, and functionality
- Performs accessibility testing using axe-core and Puppeteer
- Analyzes bundle size using source-map-explorer

#### VS Code Extension

Located in `apps/vscode/.github/workflows/ci.yml`:

- Runs on pushes and pull requests affecting the extension or shared packages
- Tests building and functionality
- Analyzes bundle size
- Creates a VSIX package for distribution

#### CLI Tool

Located in `apps/cli/.github/workflows/ci.yml`:

- Runs on pushes and pull requests affecting the CLI or shared packages
- Tests building and functionality
- Creates an npm package
- Performs cross-platform testing on Ubuntu, Windows, and macOS

## Workflow Configuration

### Dependency Caching

All workflows use pnpm's caching capability for faster builds:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
```

### Build Process

Each component is built using its specific build script:

```yaml
- name: Build
  run: |
    cd apps/<component>
    pnpm run build
```

### Artifact Storage

Artifacts (packages, reports) are stored using GitHub's artifact storage:

```yaml
- name: Upload Package
  uses: actions/upload-artifact@v4
  with:
    name: package-name
    path: path/to/artifact
```

## Release Process

The release process is automated through the `release.yml` workflow:

1. A new tag is pushed to the repository (e.g., `v1.0.0`)
2. The workflow builds all components
3. Each component is packaged into its distribution format
4. A GitHub release is created with all artifacts
5. Release notes are generated from the CHANGELOG.md file

Example tag push:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Accessibility Testing

The Obsidian plugin includes automated accessibility testing:

```yaml
- name: Run Accessibility Test
  run: |
    node .github/scripts/check-accessibility.js
```

This script uses axe-core to verify WCAG compliance in UI components.

## Bundle Analysis

Component-specific workflows include bundle size analysis:

```yaml
- name: Analyze Bundle Size
  run: |
    npx source-map-explorer <path-to-bundle> --html bundle-analysis.html
```

This helps identify potential performance issues and dependencies that could be optimized.

## Cross-Platform Compatibility

The CLI tool is tested on multiple operating systems:

```yaml
cross-platform-test:
  runs-on: ${{ matrix.os }}
  strategy:
    matrix:
      os: [ubuntu-latest, windows-latest, macos-latest]
```

This ensures the CLI functions correctly on all supported platforms.

## Troubleshooting CI/CD Issues

### Common Issues

- **Build Failures**: Check the specific error in GitHub Actions logs
- **Test Failures**: Verify if tests run locally before pushing
- **Cache Issues**: Clear caches in GitHub Actions if dependencies change significantly

### Workflow Debug Strategies

1. Enable debug logging: Set the secret `ACTIONS_STEP_DEBUG` to `true`
2. Run workflows locally using [Act](https://github.com/nektos/act)
3. Check workflow run history in GitHub Actions tab

## Future Improvements

Planned enhancements to the CI/CD workflows:

1. Add automated code coverage reporting
2. Implement visual regression testing for UI components
3. Add performance benchmarking for the CLI tool
4. Set up containerized testing environments 