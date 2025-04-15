# Testing Strategy

This document outlines the testing strategy, frameworks, and best practices for Obsidian Magic to ensure reliable,
maintainable, and high-quality code.

## Testing Philosophy

Our testing approach is guided by the following principles:

1. **Test Behavior, Not Implementation**: Focus on testing the behavior and outcomes rather than implementation details.
2. **Appropriate Test Coverage**: Ensure critical paths and complex logic have thorough test coverage.
3. **Fast Feedback Loops**: Tests should run quickly to provide immediate feedback during development.
4. **Maintainable Tests**: Tests should be easy to understand and maintain.
5. **Realistic Testing**: Tests should reflect real-world usage scenarios.

## Test Framework: Vitest

We've chosen Vitest as our testing framework for several advantages:

- Unified configuration with Vite in workspace mode
- Significantly faster test execution through parallelization
- Watch mode by default for rapid feedback during development
- Compatible API with Jest for easy migration
- Native TypeScript support without additional configuration
- Integrated code coverage via istanbul

## Test Types and Organization

We use co-located tests, placing test files directly alongside the source code they test:

```
obsidian-magic/
├── apps/
│   ├── cli/
│   │   └── src/
│   │       └── commands/
│   │           ├── tag-command.ts
│   │           └── tag-command.test.ts    # Test alongside implementation
│   ├── obsidian-plugin/
│   │   └── src/
│   │       ├── services/
│   │       │   ├── tagging-service.ts
│   │       │   └── tagging-service.test.ts
│   │       └── ui/
│   │           ├── components/
│   │           │   ├── TagEditor.tsx
│   │           │   └── TagEditor.test.tsx
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── tagging/
│   │       │   ├── classifier.ts
│   │       │   └── classifier.test.ts     # Test alongside code
│   │       ├── openai/
│   │       │   ├── client.ts
│   │       │   └── client.test.ts
│   │       └── integration.test.ts        # Integration tests near related code
│   ├── testing/ # Shared testing utilities
│   ├── types/
│   └── utils/
└── vitest.workspace.js # Workspace configuration
```

## VS Code Integration

We use VS Code file nesting to keep the explorer view clean while maintaining the co-location approach. See
[VS Code workspace settings](../../.vscode/settings.json) for configuration details.

### Unit Tests

Unit tests focus on testing individual functions, classes, and components in isolation.

#### Writing Unit Tests

Example unit test for a utility function:

```typescript
// string.test.ts
import { describe, expect, it } from 'vitest';

import { capitalize } from './string';

describe('string utils', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should not change already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });
});
```

### Integration Tests

Integration tests verify that multiple units work together correctly.

#### Writing Integration Tests

Example integration test for interacting services:

```typescript
// parsing-classification.integration.test.ts
import { describe, expect, it } from 'vitest';

import { classifyContent } from '../src/services/classifier';
import { parseMarkdown } from '../src/services/parser';

describe('parsing and classification integration', () => {
  it('should parse markdown and classify content correctly', () => {
    const markdown = '# Task\nFinish the project by tomorrow';
    const parsed = parseMarkdown(markdown);
    const classified = classifyContent(parsed);

    expect(classified.type).toBe('task');
    expect(classified.dueDate).toBeDefined();
  });
});
```

### End-to-End Tests

End-to-end tests verify that the entire application works as expected from the user's perspective.

#### Writing E2E Tests

We use Playwright for end-to-end testing. See [Playwright configuration](../../e2e/playwright.config.ts) for setup
details.

Example E2E test for the Obsidian plugin:

```typescript
// note-creation.test.ts
import { expect, test } from '@playwright/test';

import { ObsidianTestEnvironment } from '../setup/test-environment';

test.describe('Note Creation', () => {
  let env: ObsidianTestEnvironment;

  test.beforeEach(async ({ page }) => {
    env = new ObsidianTestEnvironment(page);
    await env.setup();
  });

  test('should create a new note with automatic tagging', async () => {
    await env.createNewNote();
    await env.typeInEditor('# Meeting Notes\nDiscussion about project timeline');
    await env.saveNote();

    // Verify tags were automatically applied
    const tags = await env.getNoteTags();
    expect(tags).toContain('#meeting');
  });
});
```

## Testing Frameworks and Tools

### Core Testing Technologies

1. **Vitest**: Primary test runner and assertion library for unit and integration tests
2. **Testing Library**: For testing UI components (React)
3. **Playwright**: For end-to-end testing
4. **MSW (Mock Service Worker)**: For mocking HTTP requests

## Testing Best Practices

### General Testing Guidelines

1. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Descriptive Names**: Use descriptive test names that explain the expected behavior
4. **Avoid Test Interdependence**: Tests should be able to run independently
5. **Clean Setup and Teardown**: Properly initialize and clean up test environments

### Writing Testable Code

1. **Dependency Injection**: Use dependency injection to make components testable
2. **Pure Functions**: Prefer pure functions that are easy to test
3. **Interface-Based Design**: Design with interfaces that can be mocked
4. **Separation of Concerns**: Keep components focused on single responsibilities

### Mocking Strategies

1. **Explicit Mocks**: Create explicit mocks rather than using global mock functions
2. **Minimal Mocking**: Mock only what is necessary for the test
3. **Realistic Mocks**: Make mocks behave realistically
4. **Mock Boundaries**: Mock at architectural boundaries (API calls, file system, etc.)

#### Module Mocking

We use Vitest's mocking capabilities to mock modules:

```typescript
// Mock fs-extra module
vi.mock('fs-extra', () => ({
  ensureDir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
}));

// Mock a custom module
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    configure: vi.fn(),
  },
}));
```

#### Service Mocking

We use dependency injection and the shared testing package for consistent mocks:

```typescript
import { createMockOpenAIConfig, createMockTagSet } from '@obsidian-magic/testing';

// Create consistent mock data
const mockTagSet = createMockTagSet({
  year: '2024',
  conversation_type: 'theoretical',
});

// Create service with mocked dependencies
const service = createTaggingService({
  openAIConfig: createMockOpenAIConfig(),
  // Other dependencies
});
```

### Shared Testing Utilities

We maintain a dedicated `@obsidian-magic/testing` package for:

- Factory functions for test data
- Mock service implementations
- Utility functions for test setup
- Shared fixtures and helpers

## Test-Driven Development

We encourage a test-driven development (TDD) approach for complex features:

1. **Write a Failing Test**: Start by writing a test that defines the expected behavior
2. **Implement the Minimal Code**: Write the minimum code needed to make the test pass
3. **Refactor**: Improve the code while keeping the tests passing

## Testing in CI/CD Pipeline

Our CI pipeline executes tests at different levels. See our [CI workflow configuration](../../.github/workflows/ci.yml)
for details.

### Pre-release Testing

Before each release, we run a comprehensive test suite that includes:

1. Unit and integration tests across all packages
2. End-to-end tests covering critical user flows
3. Manual testing of new features and fixed bugs

## Test Coverage Goals

We aim for the following test coverage targets:

| Package Type   | Coverage Target | Critical Path Coverage |
| -------------- | --------------- | ---------------------- |
| Core libraries | 90%+            | 100%                   |
| UI components  | 80%+            | 100%                   |
| Applications   | 70%+            | 90%+                   |

Coverage is monitored through:

1. CI pipeline reports
2. Pull request reviews
3. Regular coverage audits

## Running Tests

To run tests:

- All tests: `pnpm test` (runs tests in all packages)
- Single package: `pnpm --filter @obsidian-magic/core test`
- Watch mode: `pnpm --filter @obsidian-magic/core test -- --watch`
- Coverage: `pnpm --filter @obsidian-magic/core test -- --coverage`

## Performance Testing

For critical performance paths, we include performance tests:

```typescript
// parser.performance.test.ts
import fs from 'fs';

import { bench, describe, expect, it } from 'vitest';

import { parseMarkdown } from './parser';

const largeMarkdown = fs.readFileSync('./test-fixtures/large-document.md', 'utf-8');

describe('parser performance', () => {
  bench(
    'should parse large markdown document quickly',
    () => {
      parseMarkdown(largeMarkdown);
    },
    { time: 1000 }
  );
});
```

## Accessibility Testing

For UI components, we include accessibility tests using jest-axe. See our
[accessibility guidelines](./accessibility-ux.md) for more details.

## Test Documentation

### Test Documentation Standards

1. **Clear Purpose**: Document the purpose of complex test suites
2. **Test Data Explanation**: Explain non-obvious test data
3. **Mock Behavior Documentation**: Document expected behavior of mocks

Example of well-documented test:

```typescript
/**
 * Tests the document processor's ability to handle various edge cases
 * including malformed input, nested structures, and special characters.
 *
 * The test data includes:
 * - Empty documents
 * - Documents with only metadata
 * - Deeply nested lists (10+ levels)
 * - Special Unicode characters
 */
describe('DocumentProcessor edge cases', () => {
  // Test cases...
});
```

## Continuous Improvement

We regularly review and improve our testing practices through:

1. **Test Retrospectives**: Regular reviews of test effectiveness
2. **Test Refactoring**: Periodic refactoring of test code
3. **New Tool Evaluation**: Evaluation of new testing tools and approaches
