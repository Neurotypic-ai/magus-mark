# CI/CD Workflows

This document describes the continuous integration and continuous deployment (CI/CD) workflows set up for the Obsidian
Magic project using GitHub Actions.

## Overview

Obsidian Magic uses GitHub Actions for CI/CD across all components of the project within the Nx workspace. The workflows
are designed to:

1. Validate code quality through building, linting, and testing across the workspace.
2. Perform automated accessibility checks for UI components (where applicable).
3. Analyze bundle sizes for performance optimization (for applications).
4. Create deployable packages for each application component (CLI, Plugin, VS Code Extension).
5. Automate the release process based on Git tags.

## Workflow Structure

The primary workflows are located in `.github/workflows/`:

- **CI Workflow (`ci.yml`)**: Runs on all push and pull request events targeting the `main` branch.

  - Sets up Node.js environment (currently Node 20).
  - Installs dependencies using `pnpm install`.
  - Performs linting across the workspace: `nx run-many --target=lint`.
  - Runs type checking: `nx run-many --target=typecheck`.
  - Builds all packages and applications: `nx run-many --target=build`.
  - Runs tests across the workspace: `nx run-many --target=test`. This executes tests for all packages, including Vitest
    and Mocha tests as configured per package.

- **Release Workflow (`release.yml`)**: Triggered manually or when a new tag matching `v*.*.*` is pushed.
  - Performs similar setup and validation steps as the CI workflow.
  - Packages the Obsidian plugin, VS Code extension, and CLI tool using dedicated Nx targets (e.g.,
    `nx package vscode`).
  - Creates a GitHub release with all packaged artifacts.
  - Optionally generates release notes from the CHANGELOG or commit history.

## Workflow Configuration

### Dependency Caching

All workflows leverage pnpm's caching and GitHub Actions caching for faster dependency installation:

```yaml
- name: Setup Node.js and Cache
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'

- name: Install Dependencies
  run: pnpm install --frozen-lockfile
```

### Nx Integration

Workflows utilize Nx commands to run tasks across the workspace efficiently:

```yaml
- name: Run Linting
  run: nx run-many --target=lint

- name: Run Tests
  run: nx run-many --target=test

- name: Build All
  run: nx run-many --target=build
```

Nx Cloud can be optionally configured (`NX_CLOUD_ACCESS_TOKEN` secret) to enable distributed task execution and caching,
significantly speeding up CI runs.

### Artifact Storage

Artifacts (packages, reports) are stored using `actions/upload-artifact`:

```yaml
- name: Package VS Code Extension
  run: nx package vscode

- name: Upload VS Code Package
  uses: actions/upload-artifact@v4
  with:
    name: vscode-extension
    path: dist/apps/vscode/*.vsix
```

## Release Process

The release process is automated through the `release.yml` workflow:

1. A new tag is pushed to the repository (e.g., `git tag v1.0.0 && git push origin v1.0.0`).
2. The `release.yml` workflow triggers.
3. The workflow builds, tests, and lints the entire workspace.
4. Application artifacts (CLI executable, Obsidian plugin zip, VS Code VSIX) are packaged using specific Nx targets.
5. A GitHub release is created, attaching the generated artifacts.
6. Release notes can be automatically generated based on conventional commits or manually curated.

## Accessibility Testing

Accessibility checks might be integrated into the testing phase for relevant UI packages (e.g., Obsidian Plugin) using
tools like `axe-core` within Vitest/React Testing Library tests.

```text
// Example within a Vitest test
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Bundle Analysis

Bundle size analysis can be added as a step for application builds, typically using `source-map-explorer`:

```yaml
- name: Build VS Code Extension
  run: nx build vscode --production

- name: Analyze Bundle Size
  run: npx source-map-explorer dist/apps/vscode/**/*.js --html vscode-bundle-analysis.html

- name: Upload Bundle Analysis
  uses: actions/upload-artifact@v4
  with:
    name: vscode-bundle-analysis
    path: vscode-bundle-analysis.html
```

## Cross-Platform Compatibility

The CLI tool can be tested on multiple operating systems within the CI workflow:

```yaml
jobs:
  test-cli:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      # ... checkout, setup, install ...
      - name: Test CLI on ${{ matrix.os }}
        run: nx test cli
```

## Troubleshooting CI/CD Issues

### Common Issues

- **Build Failures**: Check specific errors in GitHub Actions logs. Often related to type errors or incorrect
  dependencies.
- **Test Failures**: Verify tests pass locally (`nx test <project>`) before pushing. Ensure mocks are correct.
- **Lint Failures**: Run `nx run-many --target=lint --fix` locally.
- **Cache Issues**: Clear caches in GitHub Actions if dependencies or configurations change significantly, although Nx
  caching is generally reliable.

### Workflow Debug Strategies

1. **Enable Debug Logging**: Set the repository secret `ACTIONS_STEP_DEBUG` to `true`.
2. **Run Locally**: Use tools like [Act](https://github.com/nektos/act) (though full Nx compatibility might vary).
3. **Examine Logs**: Carefully review the detailed logs in the GitHub Actions run summary.
4. **Inspect Nx Cache**: If using Nx Cloud, inspect the run details and cache hits/misses on the Nx Cloud dashboard.

## Future Improvements

Planned enhancements to the CI/CD workflows:

1. Integrate automated code coverage reporting (e.g., uploading reports to Codecov).
2. Implement visual regression testing for UI components.
3. Add performance benchmarking for the CLI tool.
4. Optimize Nx Cloud integration for maximum caching efficiency.
