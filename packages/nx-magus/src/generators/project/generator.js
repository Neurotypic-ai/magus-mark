import * as path from 'path';

import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
} from '@nx/devkit';

export default async function (tree, options) {
  const projectName = names(options.name).fileName;
  const projectRoot = options.directory
    ? `${options.directory}/${projectName}`
    : options.type === 'app'
      ? `${getWorkspaceLayout(tree).appsDir}/${projectName}`
      : `${getWorkspaceLayout(tree).libsDir}/${projectName}`;

  // Normalize options
  const normalizedOptions = normalizeOptions(tree, options, projectRoot);

  // Generate project configuration
  addProjectConfiguration(tree, projectName, {
    root: projectRoot,
    projectType: options.type === 'app' ? 'application' : 'library',
    sourceRoot: `${projectRoot}/src`,
    targets: generateTargets(normalizedOptions),
    tags: normalizedOptions.parsedTags,
  });

  // Generate files
  generateFiles(tree, path.join(__dirname, 'files/common'), projectRoot, normalizedOptions);

  // Generate type-specific files
  generateFiles(tree, path.join(__dirname, `files/${options.type}`), projectRoot, normalizedOptions);

  // Generate test framework specific files
  if (options.testFramework) {
    generateFiles(
      tree,
      path.join(__dirname, `files/test-frameworks/${options.testFramework}`),
      projectRoot,
      normalizedOptions
    );
  }

  // Generate build tool specific files
  if (options.buildTool && options.buildTool !== 'tsc') {
    generateFiles(tree, path.join(__dirname, `files/build-tools/${options.buildTool}`), projectRoot, normalizedOptions);
  }

  // React support
  if (options.useReact) {
    generateFiles(tree, path.join(__dirname, 'files/react'), projectRoot, normalizedOptions);
  }

  await formatFiles(tree);

  // Output completion message
  console.log(`✅ Generated a new ${options.type} project in ${projectRoot}`);
  console.log(`🧪 Test framework: ${options.testFramework}`);
  console.log(`🔨 Build tool: ${options.buildTool}`);
  if (options.useReact) {
    console.log('⚛️ React support enabled');
  }
}

function normalizeOptions(tree, options, projectRoot) {
  const name = names(options.name).fileName;
  const projectDirectory = projectRoot;
  const projectName = name.replace(new RegExp('/', 'g'), '-');
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  return {
    ...options,
    projectName,
    projectRoot: projectDirectory,
    projectDirectory,
    parsedTags,
    offsetFromRoot: offsetFromRoot(projectDirectory),
  };
}

function generateTargets(options) {
  const targets = {};

  // Build target based on build tool
  if (options.buildTool === 'esbuild') {
    targets.build = {
      executor: '@nx/esbuild:esbuild',
      outputs: ['{options.outputPath}'],
      options: {
        outputPath: `dist/${options.projectRoot}`,
        main: `${options.projectRoot}/src/index.ts`,
        tsConfig: `${options.projectRoot}/tsconfig.json`,
        assets: [`${options.projectRoot}/*.md`],
      },
      configurations: {
        production: {
          minify: true,
          sourceMap: false,
        },
      },
    };
  } else if (options.buildTool === 'vite') {
    targets.build = {
      executor: '@nx/vite:build',
      outputs: ['{options.outputPath}'],
      options: {
        outputPath: `dist/${options.projectRoot}`,
      },
    };
  } else if (options.buildTool === 'tsc') {
    targets.build = {
      executor: '@nx/js:tsc',
      outputs: ['{options.outputPath}'],
      options: {
        outputPath: `dist/${options.projectRoot}`,
        main: `${options.projectRoot}/src/index.ts`,
        tsConfig: `${options.projectRoot}/tsconfig.json`,
        assets: [`${options.projectRoot}/*.md`],
      },
    };
  }

  // Test target based on test framework
  if (options.testFramework === 'vitest') {
    targets.test = {
      executor: '@nx/vite:test',
      outputs: [`coverage/${options.projectRoot}`],
      options: {
        passWithNoTests: true,
        reportsDirectory: `coverage/${options.projectRoot}`,
      },
    };
  } else if (options.testFramework === 'jest') {
    targets.test = {
      executor: '@nx/jest:jest',
      outputs: [`coverage/${options.projectRoot}`],
      options: {
        jestConfig: `${options.projectRoot}/jest.config.js`,
        passWithNoTests: true,
      },
    };
  } else if (options.testFramework === 'mocha') {
    targets.test = {
      executor: '@nx/js:test',
      outputs: [`coverage/${options.projectRoot}`],
      options: {
        testPathPattern: [`${options.projectRoot}/src/**/*.spec.ts`, `${options.projectRoot}/src/**/*.test.ts`],
      },
    };
  }

  // Lint target (common)
  targets.lint = {
    executor: '@nx/eslint:lint',
    options: {
      lintFilePatterns: [`${options.projectRoot}/**/*.ts`],
    },
  };

  return targets;
}
