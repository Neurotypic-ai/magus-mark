# Obsidian Magic Build System Implementation Checklist

This checklist provides a structured approach to implementing the build system improvements.

## Preparation Steps

- [ ] **Review existing architecture**
  - [ ] Identify current build system challenges
  - [ ] Document current project structure
  - [ ] Assess TypeScript configuration needs
  - [ ] Evaluate testing framework requirements
  - [ ] Review code quality standards

## Phase 1: Configuration Structure

- [ ] **Create centralized configuration structure**
  - [ ] Create `config/` directory at project root
  - [ ] Create subdirectories for each configuration type:
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
    └── nx/
        └── nx.json
    ```
  - [ ] Implement base TypeScript configuration:
    ```json
    // config/typescript/tsconfig.base.json
    {
      "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "esModuleInterop": true,
        "sourceMap": true,
        "declaration": true,
        "declarationMap": true,
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "composite": true,
        "incremental": true,
        "isolatedModules": true
      }
    }
    ```
  - [ ] Implement template for library TypeScript configuration:
    ```json
    // config/typescript/templates/tsconfig.lib.json
    {
      "extends": "../../config/typescript/tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src",
        "types": ["node"]
      },
      "include": ["src/**/*"],
      "exclude": ["**/*.test.ts", "**/*.spec.ts", "node_modules"]
    }
    ```
  - [ ] Implement template for test TypeScript configuration:
    ```json
    // config/typescript/templates/tsconfig.test.json
    {
      "extends": "../../config/typescript/tsconfig.base.json",
      "compilerOptions": {
        "outDir": "./dist/test",
        "rootDir": ".",
        "types": ["node", "vitest/globals"]
      },
      "include": ["src/**/*.test.ts", "src/**/*.spec.ts"],
      "references": [{ "path": "./tsconfig.lib.json" }]
    }
    ```
  - [ ] Create base ESLint configuration:
    ```javascript
    // config/eslint/base.config.js
    module.exports = {
      root: true,
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint'],
      rules: {
        'no-console': 'warn',
        '@typescript-eslint/explicit-function-return-type': ['error', {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        }],
        '@typescript-eslint/no-unused-vars': ['error', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-return': 'error'
      }
    };
    ```
  - [ ] Create React-specific ESLint configuration:
    ```javascript
    // config/eslint/react.config.js
    const baseConfig = require('./base.config');

    module.exports = {
      ...baseConfig,
      extends: [
        ...baseConfig.extends,
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended'
      ],
      plugins: [...baseConfig.plugins, 'react', 'react-hooks', 'jsx-a11y'],
      settings: {
        react: {
          version: 'detect'
        }
      },
      rules: {
        ...baseConfig.rules,
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'jsx-a11y/anchor-is-valid': 'error'
      }
    };
    ```
  - [ ] Create base Vitest configuration:
    ```typescript
    // config/vitest/base.config.ts
    import { defineConfig } from 'vitest/config';
    import tsconfigPaths from 'vite-tsconfig-paths';

    export default defineConfig({
      plugins: [tsconfigPaths()],
      test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.ts', '**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'config/**',
            '**/*.d.ts',
            '**/*.test.ts',
            '**/*.spec.ts',
            '**/index.ts',
          ],
        },
      },
    });
    ```
  - [ ] Create React-specific Vitest configuration:
    ```typescript
    // config/vitest/react.config.ts
    import { mergeConfig } from 'vitest/config';
    import baseConfig from './base.config';

    export default mergeConfig(baseConfig, {
      test: {
        environment: 'jsdom',
        setupFiles: ['./config/vitest/setup-react.ts'],
      },
    });
    ```
  - [ ] Update root config files to reference the centralized configs

## Phase 2: TypeScript Project References

- [ ] **Implement TypeScript project references structure**
  - [ ] Update root `tsconfig.json` to include references to all packages:
    ```json
    // tsconfig.json
    {
      "extends": "./config/typescript/tsconfig.base.json",
      "files": [],
      "references": [
        { "path": "packages/types" },
        { "path": "packages/utils" },
        { "path": "packages/core" },
        { "path": "apps/cli" },
        { "path": "apps/obsidian-plugin" },
        { "path": "apps/vscode" }
      ]
    }
    ```
  - [ ] For each package, create package-level `tsconfig.json`:
    ```json
    // packages/core/tsconfig.json
    {
      "extends": "../../config/typescript/templates/tsconfig.lib.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src"
      },
      "references": [
        { "path": "../types" },
        { "path": "../utils" }
      ]
    }
    ```
  - [ ] Create `tsconfig.lib.json` for production code in each package:
    ```json
    // packages/core/tsconfig.lib.json
    {
      "extends": "../../config/typescript/templates/tsconfig.lib.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src"
      },
      "references": [
        { "path": "../types" },
        { "path": "../utils" }
      ]
    }
    ```
  - [ ] Create `tsconfig.test.json` for test files in each package:
    ```json
    // packages/core/tsconfig.test.json
    {
      "extends": "../../config/typescript/templates/tsconfig.test.json",
      "compilerOptions": {
        "rootDir": ".",
        "types": ["node", "vitest/globals"]
      },
      "include": ["src/**/*.test.ts", "src/**/*.spec.ts"],
      "references": [{ "path": "./tsconfig.lib.json" }]
    }
    ```
  - [ ] Validate build process with `tsc -b` at root
  
## Phase 3: Nx Workspace Setup

- [ ] **Install and configure Nx**
  - [ ] Install Nx dependencies: `npm install -D nx @nx/js`
  - [ ] Create initial nx.json configuration:
    ```json
    // nx.json
    {
      "extends": "nx/presets/npm.json",
      "tasksRunnerOptions": {
        "default": {
          "runner": "nx/tasks-runners/default",
          "options": {
            "cacheableOperations": ["build", "test", "lint"]
          }
        }
      },
      "targetDefaults": {
        "build": {
          "dependsOn": ["^build"],
          "outputs": ["{projectRoot}/dist"]
        },
        "test": {
          "dependsOn": ["build"],
          "inputs": ["default", "^default"]
        },
        "lint": {
          "inputs": ["default", "{workspaceRoot}/.eslintrc.js"]
        }
      },
      "defaultBase": "main"
    }
    ```
  - [ ] Define projects in nx.json for each package/app:
    ```json
    // nx.json (additional section)
    {
      "projects": {
        "types": {
          "root": "packages/types",
          "sourceRoot": "packages/types/src",
          "projectType": "library",
          "targets": {
            "build": {
              "executor": "@nx/js:tsc",
              "options": {
                "outputPath": "packages/types/dist",
                "tsConfig": "packages/types/tsconfig.lib.json",
                "packageJson": "packages/types/package.json",
                "main": "packages/types/src/index.ts",
                "assets": ["packages/types/*.md"]
              }
            },
            "test": {
              "executor": "@nx/vite:test",
              "options": {
                "config": "packages/types/vite.config.ts"
              }
            },
            "lint": {
              "executor": "@nx/eslint:lint",
              "options": {
                "lintFilePatterns": ["packages/types/**/*.ts"]
              }
            }
          },
          "tags": ["scope:shared"]
        },
        // Repeat similar configuration for other packages and apps
      }
    }
    ```
  - [ ] Test Nx commands: `npx nx run-many --target=build`

## Phase 4: Vitest Configuration

- [ ] **Create package-specific Vitest configurations**
  - [ ] Create workspace configuration for running all tests:
    ```javascript
    // vitest.workspace.js
    import { defineWorkspace } from 'vitest/config';

    export default defineWorkspace([
      'packages/*/vitest.config.ts',
      'apps/*/vitest.config.ts',
    ]);
    ```
  - [ ] Create package-specific configuration:
    ```typescript
    // packages/core/vitest.config.ts
    import { defineConfig } from 'vitest/config';
    import { mergeConfig } from 'vite';
    import * as path from 'path';
    import baseConfig from '../../config/vitest/base.config';

    export default mergeConfig(
      baseConfig,
      defineConfig({
        resolve: {
          alias: {
            '@src': path.resolve(__dirname, './src'),
            '@tests': path.resolve(__dirname, './tests')
          }
        },
        test: {
          coverage: {
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage'
          }
        }
      })
    );
    ```
  - [ ] Validate tests run correctly: `npx nx run-many --target=test`

## Phase 5: ESLint Configuration

- [ ] **Update package-level ESLint configurations**
  - [ ] Create package-specific ESLint configuration:
    ```javascript
    // packages/core/.eslintrc.js
    module.exports = {
      extends: ['../../config/eslint/base.config.js'],
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      }
    };
    ```
  - [ ] Create React app ESLint configuration:
    ```javascript
    // apps/obsidian-plugin/.eslintrc.js
    module.exports = {
      extends: ['../../config/eslint/react.config.js'],
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      }
    };
    ```
  - [ ] Run lint check across all packages: `npx nx run-many --target=lint`

## Phase 6: Package Scripts Standardization

- [ ] **Update all package.json files with consistent scripts**
  - [ ] Update core package.json:
    ```json
    // packages/core/package.json
    {
      "name": "@obsidian-magic/core",
      "version": "0.1.0",
      "scripts": {
        "build": "tsc -b",
        "clean": "rimraf ./dist ./out-tsc",
        "test": "vitest run",
        "test:watch": "vitest",
        "lint": "eslint .",
        "lint:fix": "eslint . --fix"
      },
      "dependencies": {
        "@obsidian-magic/types": "workspace:*",
        "@obsidian-magic/utils": "workspace:*"
      },
      "devDependencies": {
        // Development dependencies
      }
    }
    ```
  - [ ] Create root-level convenience scripts:
    ```json
    // package.json (root)
    {
      "name": "obsidian-magic",
      "private": true,
      "workspaces": [
        "packages/*",
        "apps/*"
      ],
      "scripts": {
        "build": "nx run-many --target=build",
        "test": "nx run-many --target=test",
        "lint": "nx run-many --target=lint",
        "clean": "nx run-many --target=clean",
        "prepare": "husky install"
      }
    }
    ```
  - [ ] Validate scripts work correctly

## Phase 7: Git Hooks Implementation

- [ ] **Set up Git hooks for code quality**
  - [ ] Install Husky and lint-staged: `npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional`
  - [ ] Configure pre-commit hook in `.husky/pre-commit`:
    ```bash
    #!/bin/sh
    . "$(dirname "$0")/_/husky.sh"

    npx lint-staged
    ```
  - [ ] Set up lint-staged configuration:
    ```javascript
    // config/lint-staged/config.js
    module.exports = {
      '*.{js,ts,tsx}': ['eslint --fix', 'vitest related --run'],
      '*.{json,md}': ['prettier --write']
    };
    ```
  - [ ] Configure commitlint:
    ```javascript
    // config/commitlint/config.js
    module.exports = {
      extends: ['@commitlint/config-conventional'],
      rules: {
        'scope-enum': [2, 'always', ['core', 'cli', 'plugin', 'vscode', 'types', 'utils', 'docs', 'build', 'ci']],
        'body-max-line-length': [0]
      }
    };
    ```
  - [ ] Create commitlint config in the root:
    ```javascript
    // .commitlintrc.js
    module.exports = require('./config/commitlint/config');
    ```
  - [ ] Create `.lintstagedrc.js` in the root:
    ```javascript
    // .lintstagedrc.js
    module.exports = require('./config/lint-staged/config');
    ```
  - [ ] Test Git hooks with sample commits

## Phase 8: Production Build Collection

- [ ] **Implement unified build system**
  - [ ] Create build scripts for aggregating package outputs:
    ```javascript
    // scripts/build-all.js
    const { execSync } = require('child_process');
    const { existsSync, mkdirSync } = require('fs');
    
    // Ensure dist directory exists
    if (!existsSync('./dist')) {
      mkdirSync('./dist');
    }
    
    console.log('Building all packages...');
    execSync('npx nx run-many --target=build --all', { stdio: 'inherit' });
    
    console.log('Copying build artifacts...');
    execSync('cp -r packages/*/dist/* dist/', { stdio: 'inherit' });
    
    console.log('Build complete!');
    ```
  - [ ] Set up specialized build targets for each app type
  - [ ] Configure clean build process
  - [ ] Validate complete build process: `npm run build:all`

## Phase 9: Package Generators

- [ ] **Create package generators with Nx**
  - [ ] Define generator templates for different package types:
    ```typescript
    // generators/library/index.ts
    import type {
      Tree} from '@nx/devkit';
    import {
      formatFiles,
      generateFiles,
      names,
      offsetFromRoot
    } from '@nx/devkit';
    import * as path from 'path';

    interface LibraryGeneratorOptions {
      name: string;
      directory?: string;
      tags?: string;
    }

    export default async function (
      tree: Tree,
      options: LibraryGeneratorOptions
    ) {
      const normalizedOptions = normalizeOptions(options);
      
      generateFiles(
        tree, 
        path.join(__dirname, 'files'),
        normalizedOptions.projectRoot,
        normalizedOptions
      );
      
      await formatFiles(tree);
    }

    function normalizeOptions(options: LibraryGeneratorOptions) {
      const name = names(options.name).fileName;
      const projectDirectory = options.directory
        ? `${names(options.directory).fileName}/${name}`
        : name;
      const projectName = projectDirectory.replace(/\//g, '-');
      const projectRoot = `packages/${projectDirectory}`;
      const tags = options.tags ? options.tags.split(',') : [];
      
      return {
        ...options,
        name,
        projectName,
        projectRoot,
        projectDirectory,
        tags,
      };
    }
    ```
  - [ ] Create generator scripts for different package types
  - [ ] Test generators with sample package creation

## Phase 10: Developer Experience Improvements

- [ ] **Set up VS Code workspace settings**
  - [ ] Configure VS Code settings:
    ```json
    // .vscode/settings.json
    {
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      },
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "eslint.validate": [
        "javascript",
        "typescript",
        "typescriptreact"
      ],
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
  - [ ] Configure recommended extensions:
    ```json
    // .vscode/extensions.json
    {
      "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "vitest.explorer",
        "editorconfig.editorconfig",
        "ms-vscode.vscode-typescript-next",
        "aaron-bond.better-comments",
        "streetsidesoftware.code-spell-checker"
      ]
    }
    ```
  - [ ] Create debug configurations:
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
  - [ ] Create tasks configuration:
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
  - [ ] Document development workflow

## Completion Checklist

- [ ] All centralized configurations in place
- [ ] TypeScript project references working correctly
- [ ] Nx workspace fully configured
- [ ] Tests running correctly across all packages
- [ ] Linting working correctly
- [ ] Git hooks enforcing code quality
- [ ] Production builds generating correctly
- [ ] Package generators functioning

## References

- [TypeScript Project References Documentation](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Nx Documentation](https://nx.dev/getting-started/intro)
- [Vitest Documentation](https://vitest.dev/guide/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
