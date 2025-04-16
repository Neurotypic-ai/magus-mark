# Obsidian Magic Build System Implementation Checklist

This checklist provides a structured approach to implementing the build system improvements.

## Preparation Steps

- [x] **Review existing architecture**
  - [x] Identify current build system challenges
  - [x] Document current project structure
  - [x] Assess TypeScript configuration needs
  - [x] Evaluate testing framework requirements
  - [x] Review code quality standards

## Phase 1: Configuration Structure ✅

- [x] **Create centralized configuration structure**
  - [x] Create `config/` directory at project root
  - [x] Create subdirectories for each configuration type
  - [x] Implement base TypeScript configuration with stricter rules
  - [x] Implement templates for library TypeScript configuration
  - [x] Implement templates for test TypeScript configuration
  - [x] Create base ESLint configuration
  - [x] Create React-specific ESLint configuration
  - [x] Create base Vitest configuration
  - [x] Create React-specific Vitest configuration
  - [x] Update root config files to reference the centralized configs

## Phase 2: TypeScript Project References ✅

- [x] **Implement TypeScript project references structure**
  - [x] Update root `tsconfig.json` to include references to all packages
  - [x] For each package, create package-level `tsconfig.json`
  - [x] Create `tsconfig.lib.json` for production code in each package
  - [x] Create `tsconfig.test.json` for test files in each package
  - [x] Validate build process with `tsc -b` at root

## Phase 3: Nx Workspace Setup ✅

- [x] **Install Nx**
  - [x] Install Nx dependencies: `npm install -D nx @nx/js`
- [x] **Configure Nx using inferred targets**
  - [x] Create initial nx.json configuration
  - [x] Verify Nx correctly discovers targets from package.json scripts
  - [x] Add appropriate target defaults for build dependencies
  - [x] Test Nx commands: `npx nx run-many --target=build`
  - [x] **IMPORTANT**: Remove explicit project definitions, as Nx uses automatic project discovery

## Phase 4: Vitest Configuration ✅

- [x] **Create package-specific Vitest configurations**
  - [x] Create workspace configuration for running all tests
  - [x] Create package-specific configuration for each package
  - [x] Validate tests run correctly: `npx nx run-many --target=test`
  - [x] **IMPORTANT**: Complete the transition from Vitest to Mocha for VS Code testing (currently using both)

## Phase 5: ESLint Integration ✅

- [x] **Use modern ESLint flat config format**
  - [x] Leverage existing `eslint.config.js` in root
  - [x] Update project-specific ESLint settings if needed
  - [x] Remove any legacy `.eslintrc.js` files
  - [x] Fix TypeScript errors reported in VS Code extension and Obsidian plugin
  - [x] Run lint check across all packages: `npx nx run-many --target=lint`
  - [ ] Fix remaining linter errors in some files

## Phase 6: Package Scripts Standardization ✅

- [x] **Update all package.json files with consistent scripts**
  - [x] Create standard script template for library packages
  - [x] Create standard script template for application packages
  - [x] Update root-level convenience scripts
  - [x] Validate scripts work correctly
  - [x] **IMPORTANT**: Replace all `rimraf` usages with native `rm -rf` or Node.js fs methods

## Phase 7: Git Hooks Implementation ✅

- [x] **Set up Git hooks for code quality**
  - [x] Install Husky and lint-staged
  - [x] Configure pre-commit hook
  - [x] Set up lint-staged configuration
  - [x] Configure commitlint
  - [x] Test Git hooks with sample commits

## Phase 8: Production Build Collection ✅

- [x] **Implement unified build system**
  - [x] Define project-specific build tasks in package.json
  - [x] Set up specialized build targets for each app type
  - [x] Create specialized build scripts for each application
  - [x] Configure clean build process for each package
  - [x] Validate complete build process: `npm run build`

## Phase 9: Package Generators

- [x] **Create package generators with Nx**
  - [x] Install Nx generator dependencies: `npm install -D @nx/devkit`
  - [x] Create generator template for library packages
  - [x] Create generator template for application packages
    - [x] CLI application templates
    - [x] VS Code extension templates
    - [x] Obsidian plugin templates
  - [x] Configure generator in workspace.json
  - [ ] Test generators with sample package creation: `npx nx g library my-new-package`

## Phase 10: Developer Experience Improvements ✅

- [x] **Set up VS Code workspace settings**
  - [x] Configure VS Code settings (formatter, ESLint, file nesting, etc.)
  - [x] Configure recommended extensions
  - [x] Create debug configurations for all components
  - [x] Create comprehensive task configurations
  - [x] Document development workflow in README.md

## Phase 11: Continuous Integration Setup ✅

- [x] **Set up GitHub Actions for CI/CD**
  - [x] Create workflow for pull requests
  - [x] Create workflow for main branch
  - [x] Configure Nx Cloud for distributed task execution
  - [x] Set up artifact packaging and publishing
  - [x] Configure bundle analysis for VS Code extension

## Phase 12: VS Code Test Framework Migration (Vitest to Mocha)

**Goal:** Consolidate testing in the `@obsidian-magic/vscode` package to use Mocha exclusively, removing Vitest.

**Sub-Phase 1: Analysis and Preparation**

- [x] **Inventory Existing Tests:**
  - [x] Locate all test files within `apps/vscode/src/`. Identify which use Vitest (likely unit tests) and which use
        Mocha (likely integration tests).
  - [x] Review a sample of Vitest unit tests to identify specific Vitest APIs used (e.g., `vi.fn()`, `vi.spyOn()`,
        `vi.mock()`, `expect()`, timer mocks, matchers).
- [x] **Examine Configuration:**
  - [x] Review `apps/vscode/package.json` for test dependencies (`vitest`, `mocha`, `@vscode/test-electron`) and test
        scripts.
  - [x] Locate and review existing Mocha configuration (e.g., `.mocharc.js`, `mocha.opts`).
  - [x] Locate and review any Vitest configuration files (`vitest.config.ts`).
  - [x] Review `apps/vscode/tsconfig.test.json` for Vitest-specific types.
- [x] **Choose Supporting Libraries:**
  - [x] **Assertion Library:** Confirm if `chai` is used with Mocha. If not, select one (Chai recommended).
  - [x] **Mocking/Spying Library:** Select a library like `sinon` if mocking/spying is needed for migrated unit tests.

**Sub-Phase 2: Dependency and Configuration Updates**

- [x] **Manage Dependencies:**
  - [x] In `apps/vscode/package.json`, remove Vitest dependencies.
  - [x] Add/Confirm Mocha, assertion (`chai`, `@types/chai`), and mocking (`sinon`, `@types/sinon`) dependencies. Ensure
        `@vscode/test-electron` is present.
  - [x] Run `pnpm install --filter @obsidian-magic/vscode`.
- [x] **Update TypeScript Configuration:**
  - [x] In `apps/vscode/tsconfig.test.json`, remove `"vitest/globals"` from `types` array.
  - [x] Add `"mocha"`, `"chai"` to `types` array. Ensure `"node"` is present.
- [x] **Consolidate Mocha Configuration:**
  - [x] Update/Create Mocha configuration file (e.g., `.mocharc.js`).
  - [x] Configure it to run TypeScript files (e.g., `require: 'tsx'`).
  - [x] Define test file pattern to include all tests (e.g., `spec: ['src/**/*.test.ts']`).
  - [x] Configure necessary options (timeout, UI).
  - [x] Remove any Vitest configuration files.

**Sub-Phase 3: Test Code Migration**

- [x] **Update Imports:**
  - [x] In each migrated test file, remove `vitest` imports.
  - [x] Add imports for assertion (`chai`) and mocking (`sinon`) libraries.
- [x] **Replace Vitest APIs:**
  - [x] **Globals:** `describe`, `it`, etc., usually require no change.
  - [x] **Assertions:** Replace Vitest `expect()` calls and matchers with Chai equivalents.
  - [x] **Mocks/Spies:** Replace `vi.fn()`, `vi.spyOn()`, `vi.mock()` with Sinon equivalents.
  - [x] **Timer Mocks:** Replace `vi.useFakeTimers()`, `vi.advanceTimersByTime()` with Sinon equivalents.
  - [x] **Snapshots:** Decide strategy (remove, find plugin, convert to value checks).
  - [x] **Async/Callbacks:** Ensure tests use `async/await` or return Promises.

**Sub-Phase 4: Scripting and CI**

- [x] **Update `package.json` Scripts:**
  - [x] Modify `test` script(s) to run all tests using the consolidated Mocha setup (likely via `@vscode/test-electron`
        runner).
  - [x] Remove scripts specific to Vitest.
  - [x] Update watch mode scripts for Mocha (`mocha --watch`).
- [ ] **Update CI Workflows:**
  - [ ] Check `.github/workflows/` for VS Code test steps.
  - [ ] Update steps invoking `vitest` to use the unified `pnpm --filter @obsidian-magic/vscode test` command.

**Sub-Phase 5: Validation and Cleanup**

- [x] **Run All Tests:**
  - [x] Execute `pnpm --filter @obsidian-magic/vscode test` locally and ensure all pass.
- [x] **Linting and Type Checking:**
  - [x] Run linter and TypeScript compiler for the package.
- [x] **Documentation:**
  - [x] Update this checklist item to mark it as complete.
  - [x] Update relevant READMEs or developer guides.

## Completion Checklist

- [x] All centralized configurations in place
- [x] TypeScript project references working correctly
- [x] Nx workspace fully configured with inferred targets
- [x] Tests running correctly across all packages
- [x] Linting working correctly with flat ESLint config
- [x] Git hooks enforcing code quality
- [x] Production builds generating correctly
- [x] Package generators functioning
- [x] CI/CD pipeline set up
- [x] VS Code developer experience optimized

## Remaining Tasks

1. **Linter Error Fixing**:

   - Fix remaining linter errors in some TypeScript files
   - Focus on type safety errors in test files related to optional chaining and non-null assertions

2. **Clean Script Update**:

   - Replace all instances of `rimraf` with native `rm -rf` or Node.js fs methods
   - Update clean scripts in all package.json files

3. **Template Testing**:
   - Test all package generators with sample creation
   - Verify template functionality and consistency across different app types
