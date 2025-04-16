# Obsidian Magic Build System Implementation Checklist

This checklist provides a structured approach to implementing the build system improvements.

## Preparation Steps

- [x] **Review existing architecture**
  - [x] Identify current build system challenges
  - [x] Document current project structure
  - [x] Assess TypeScript configuration needs
  - [x] Evaluate testing framework requirements
  - [x] Review code quality standards

## Phase 1: Configuration Structure

- [x] **Create centralized configuration structure**
  - [x] Create `config/` directory at project root
  - [x] Create subdirectories for each configuration type:
    ```
    config/
    ├── typescript/
    │   ├── tsconfig.base.json
    │   └── templates/
    │       ├── tsconfig.lib.json
    │       └── tsconfig.test.json
    ├── eslint/
    │   ├── base.config.js
    │   └── react.config.js
    ├── vitest/
    │   ├── base.config.ts
    │   └── react.config.ts
    ├── commitlint/
    │   └── config.js
    ├── lint-staged/
    │   └── config.js
    ```
  - [x] Implement base TypeScript configuration with stricter rules
  - [x] Implement templates for library TypeScript configuration
  - [x] Implement templates for test TypeScript configuration
  - [x] Create base ESLint configuration
  - [x] Create React-specific ESLint configuration
  - [x] Create base Vitest configuration
  - [x] Create React-specific Vitest configuration
  - [x] Update root config files to reference the centralized configs

## Phase 2: TypeScript Project References

- [x] **Implement TypeScript project references structure**
  - [x] Update root `tsconfig.json` to include references to all packages
  - [x] For each package, create package-level `tsconfig.json`
  - [x] Create `tsconfig.lib.json` for production code in each package
  - [x] Create `tsconfig.test.json` for test files in each package
  - [x] Validate build process with `tsc -b` at root

## Phase 3: Nx Workspace Setup

- [x] **Install Nx**
  - [x] Install Nx dependencies: `npm install -D nx @nx/js`
- [x] **Configure Nx using inferred targets**
  - [x] Create initial nx.json configuration
  - [x] Verify Nx correctly discovers targets from package.json scripts
  - [x] Add appropriate target defaults for build dependencies
  - [x] Test Nx commands: `npx nx run-many --target=build`
  - [x] **IMPORTANT**: Remove explicit project definitions, as Nx uses automatic project discovery

## Phase 4: Vitest Configuration

- [x] **Create package-specific Vitest configurations**

  - [x] Create workspace configuration for running all tests:

    ```js
    // vitest.workspace.js
    import { defineWorkspace } from 'vitest/config';

    export default defineWorkspace(['packages/*/vitest.config.ts', 'apps/*/vitest.config.ts']);
    ```

  - [x] Create package-specific configuration for each package:

    ```ts
    // packages/core/vitest.config.ts
    import path from 'path';

    import { mergeConfig } from 'vite';
    import { defineConfig } from 'vitest/config';

    import baseConfig from '../../config/vitest/base.config';

    export default mergeConfig(
      baseConfig,
      defineConfig({
        resolve: {
          alias: {
            '@src': path.resolve(__dirname, './src'),
            '@tests': path.resolve(__dirname, './tests'),
          },
        },
        test: {
          coverage: {
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
          },
        },
      })
    );
    ```

  - [x] Validate tests run correctly: `npx nx run-many --target=test`
  - [ ] **IMPORTANT**: Complete the transition from Vitest to Mocha for VS Code testing (currently using both)

## Phase 5: ESLint Integration

- [x] **Use modern ESLint flat config format**
  - [x] Leverage existing `eslint.config.js` in root
  - [x] Update project-specific ESLint settings if needed
  - [x] Remove any legacy `.eslintrc.js` files
  - [x] Fix TypeScript errors reported in VS Code extension and Obsidian plugin
  - [x] Run lint check across all packages: `npx nx run-many --target=lint`
  - [ ] Fix remaining linter errors in some files

## Phase 6: Package Scripts Standardization

- [x] **Update all package.json files with consistent scripts**
  - [x] Create standard script template for library packages:
    ```json
    {
      "scripts": {
        "build": "tsc -b",
        "clean": "rm -rf ./dist ./out-tsc ./coverage",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage",
        "lint": "eslint .",
        "lint:fix": "eslint . --fix",
        "typecheck": "tsc --noEmit"
      }
    }
    ```
  - [x] Create standard script template for application packages
  - [x] Update root-level convenience scripts:
    ```json
    {
      "scripts": {
        "build": "nx run-many --target=build",
        "test": "nx run-many --target=test",
        "lint": "nx run-many --target=lint",
        "clean": "nx run-many --target=clean",
        "typecheck": "nx run-many --target=typecheck",
        "prepare": "husky install"
      }
    }
    ```
  - [x] Validate scripts work correctly
  - [ ] **IMPORTANT**: Replace all `rimraf` usages with native `rm -rf` or Node.js fs methods

## Phase 7: Git Hooks Implementation

- [x] **Set up Git hooks for code quality**
  - [x] Install Husky and lint-staged
  - [x] Configure pre-commit hook
  - [x] Set up lint-staged configuration
  - [x] Configure commitlint
  - [x] Test Git hooks with sample commits

## Phase 8: Production Build Collection

- [x] **Implement unified build system**

  - [x] Define project-specific build tasks in package.json
  - [x] Set up specialized build targets for each app type:
    - Obsidian plugin (output: bundled .js file)
    - VS Code extension (output: VSIX package)
    - CLI (output: executable)
  - [x] Create specialized build scripts for each application:

    ```js
    // apps/cli/scripts/build.js
    const { execSync } = require('child_process');

    console.log('Building CLI app...');
    execSync('tsc -b', { stdio: 'inherit' });

    console.log('Bundling CLI for distribution...');
    execSync('esbuild src/index.js --bundle --platform=node --outfile=dist/cli.js', { stdio: 'inherit' });

    console.log('Setting executable permissions...');
    execSync('chmod +x dist/cli.js', { stdio: 'inherit' });

    console.log('Build complete!');
    ```

  - [x] Configure clean build process for each package
  - [x] Validate complete build process: `npm run build`

## Phase 9: Package Generators

- [ ] **Create package generators with Nx**
  - [ ] Install Nx generator dependencies: `npm install -D @nx/devkit`
  - [ ] Create generator template for library packages:
    ```
    generators/
    ├── library/
    │   ├── index.ts
    │   └── files/
    │       ├── package.json
    │       ├── tsconfig.json
    │       ├── tsconfig.lib.json
    │       ├── tsconfig.test.json
    │       ├── vitest.config.ts
    │       ├── src/
    │       │   └── index.ts
    │       └── README.md
    ```
  - [ ] Create generator template for application packages
  - [ ] Configure generator in workspace.json:
    ```json
    {
      "generators": {
        "library": {
          "factory": "./generators/library",
          "schema": "./generators/library/schema.json",
          "description": "Create a new library package"
        },
        "app": {
          "factory": "./generators/app",
          "schema": "./generators/app/schema.json",
          "description": "Create a new application"
        }
      }
    }
    ```
  - [ ] Test generators with sample package creation: `npx nx g library my-new-package`

## Phase 10: Developer Experience Improvements

- [x] **Set up VS Code workspace settings**
  - [x] Configure VS Code settings:
    ```json
    // .vscode/settings.json
    {
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "eslint.validate": ["javascript", "typescript", "typescriptreact"],
      "typescript.tsdk": "node_modules/typescript/lib",
      "typescript.enablePromptUseWorkspaceTsdk": true,
      "explorer.fileNesting.enabled": true,
      "explorer.fileNesting.patterns": {
        "*.ts": "${capture}.test.ts, ${capture}.spec.ts, ${capture}.d.ts"
      },
      "files.exclude": {
        "**/.git": true,
        "**/node_modules": true,
        "**/dist": true,
        "**/coverage": true
      }
    }
    ```
  - [x] Configure recommended extensions:
    ```json
    // .vscode/extensions.json
    {
      "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "vitest.explorer",
        "editorconfig.editorconfig",
        "ms-vscode.vscode-typescript-next",
        "nrwl.angular-console",
        "streetsidesoftware.code-spell-checker"
      ]
    }
    ```
  - [x] Create debug configurations:
    ```json
    // .vscode/launch.json
    {
      "version": "0.2.0",
      "configurations": [
        {
          "type": "node",
          "request": "launch",
          "name": "Debug CLI",
          "skipFiles": ["<node_internals>/**"],
          "program": "${workspaceFolder}/apps/cli/dist/index.js",
          "args": ["tag", "--input", "example.md"],
          "outFiles": ["${workspaceFolder}/apps/cli/dist/**/*.js"],
          "preLaunchTask": "build:cli"
        },
        {
          "type": "node",
          "request": "launch",
          "name": "Debug Vitest Tests",
          "autoAttachChildProcesses": true,
          "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
          "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
          "args": ["run", "${relativeFile}"],
          "smartStep": true,
          "console": "integratedTerminal"
        }
      ]
    }
    ```
  - [x] Create tasks configuration:
    ```json
    // .vscode/tasks.json
    {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "build:cli",
          "type": "shell",
          "command": "npx nx build cli",
          "group": "build"
        },
        {
          "label": "test:current",
          "type": "shell",
          "command": "npx vitest run ${relativeFile}",
          "group": "test"
        }
      ]
    }
    ```
  - [x] Document development workflow in README.md

## Phase 11: Continuous Integration Setup

- [ ] **Set up GitHub Actions for CI/CD**

  - [ ] Create workflow for pull requests:

    ```yaml
    # .github/workflows/pull-request.yml
    name: Pull Request

    on:
      pull_request:
        branches: [main]

    jobs:
      validate:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
            with:
              fetch-depth: 0
          - uses: actions/setup-node@v3
            with:
              node-version: 18
              cache: 'pnpm'
          - run: pnpm install --frozen-lockfile
          - run: npx nx affected --target=lint --parallel=3
          - run: npx nx affected --target=test --parallel=3
          - run: npx nx affected --target=build --parallel=3
    ```

  - [ ] Create workflow for main branch:

    ```yaml
    # .github/workflows/main.yml
    name: Main

    on:
      push:
        branches: [main]

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
            with:
              fetch-depth: 0
          - uses: actions/setup-node@v3
            with:
              node-version: 18
              cache: 'pnpm'
          - run: pnpm install --frozen-lockfile
          - run: npx nx affected --target=build --parallel=3 --base=HEAD~1
          - run: npx nx affected --target=test --parallel=3 --base=HEAD~1
    ```

  - [ ] Test CI/CD workflows locally with GitHub CLI: `gh workflow run pull-request.yml`

## Completion Checklist

- [x] All centralized configurations in place
- [x] TypeScript project references working correctly
- [x] Nx workspace fully configured with inferred targets
- [x] Tests running correctly across all packages
- [x] Linting working correctly with flat ESLint config
- [x] Git hooks enforcing code quality
- [x] Production builds generating correctly
- [ ] Package generators functioning
- [ ] CI/CD pipeline set up

## Remaining Tasks

1. **Testing Framework Transition**:

   - Complete the transition from Vitest to Mocha for VS Code extension testing
   - Currently, the VS Code extension uses both Mocha for integration tests and Vitest for unit tests
   - Standardize on one testing approach for VS Code extension

2. **Linter Error Fixing**:

   - Fix remaining linter errors in some TypeScript files
   - Focus on type safety errors in test files related to optional chaining and non-null assertions

3. **Clean Script Update**:

   - Replace all instances of `rimraf` with native `rm -rf` or Node.js fs methods
   - Update clean scripts in all package.json files

4. **Package Generators**:

   - Implement Nx generators for creating new packages and applications
   - Create templates based on established patterns

5. **CI/CD Setup**:
   - Implement GitHub Actions workflows for CI/CD
   - Set up automated testing and linting

## Key Lessons Learned

1. **Nx Configuration Must Be Flat** - Nx doesn't support nested configuration files via the "extends" property, all
   configuration must be in the root nx.json file
2. **TypeScript Configuration Is Stricter** - We've implemented more stringent TypeScript rules
3. **Project References Are Working** - We've successfully set up TypeScript project references for better build
   performance
4. **ESLint Uses Flat Config** - Modern ESLint configuration uses the flat config format with a single eslint.config.js
5. **Nx Uses Inferred Targets** - Nx can automatically discover and infer targets from package.json scripts
6. **Standardized Build Process** - Each package follows the same build process, making maintenance easier
7. **Developer Experience Matters** - VS Code configuration and debug settings improve productivity
8. **Config Structure Implementation** - We deviated from the original plan for config structure, but the implemented
   version is more effective and maintainable
9. **Mixed Testing Frameworks** - Using Mocha for VS Code extension and Vitest for other packages requires careful
   configuration
10. **Native Commands Preferred** - Native shell commands are preferred over dependencies like rimraf for simple
    operations

## References

- [TypeScript Project References Documentation](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Nx Documentation](https://nx.dev/getting-started/intro)
- [Vitest Documentation](https://vitest.dev/guide/)
- [ESLint Flat Config Documentation](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Mocha Documentation](https://mochajs.org/)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
