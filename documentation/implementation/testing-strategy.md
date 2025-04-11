# Testing Strategy

The project implements a comprehensive testing strategy using Vitest, a Vite-native test runner:

## Test Framework: Vitest

We've chosen Vitest as our testing framework for several advantages:
- Unified configuration with Vite (reuses `vite.config.ts`)
- Significantly faster test execution through parallelization
- Watch mode by default for rapid feedback during development
- Compatible API with Jest for easy migration
- Native TypeScript support without additional configuration
- Integrated code coverage via c8/istanbul

## Test Organization

Instead of a centralized test directory, we organize tests near the code they're testing:

```
src/
├── core/
│   ├── tagging/
│   │   ├── classifier.ts
│   │   ├── classifier.test.ts  # Test alongside code
│   │   └── __tests__/          # Complex test suites
│   │       ├── fixtures/
│   │       └── integration.test.ts
│   └── openai/
│       ├── client.ts
│       └── client.test.ts
├── cli/
│   └── commands/
│       ├── tag-command.ts
│       └── tag-command.test.ts
└── plugin/
    └── ui/
        ├── components/
        │   ├── TagEditor.tsx
        │   └── TagEditor.test.tsx
        └── __tests__/          # UI integration tests
```

## Unit Tests

- Component-level tests using Vitest
- Mocked dependencies via `vi.mock()` and `vi.spyOn()`
- High coverage of core business logic
- Snapshot testing for UI components

## Mocking Strategy

### Module Mocking

We use Vitest's mocking capabilities for both internal and external dependencies:

```typescript
// Mocking a module
import { expect, test, vi } from 'vitest'
import { tagDocument } from '../tagging'
import { openai } from '../openai'

// Mock the OpenAI module
vi.mock('../openai', () => ({
  openai: {
    generateTags: vi.fn().mockResolvedValue({
      year: '2023',
      conversationType: 'practical'
    })
  }
}))

test('tagging uses OpenAI for classification', async () => {
  await tagDocument('sample-content')
  expect(openai.generateTags).toHaveBeenCalledWith('sample-content')
})
```

### Mocking Libraries & Patterns

1. **Service Mocks**: Use dependency injection to inject mock services
   ```typescript
   import { createTaggingService } from '../tagging'
   
   const mockOpenAIService = {
     classifyContent: vi.fn().mockResolvedValue(/* mock data */)
   }
   
   const taggingService = createTaggingService({
     openaiService: mockOpenAIService,
     // other config
   })
   ```

2. **API Mocks**: For external API calls, use MSW (Mock Service Worker)
   ```typescript
   import { setupServer } from 'msw/node'
   import { http, HttpResponse } from 'msw'
   
   const server = setupServer(
     http.post('https://api.openai.com/v1/chat/completions', () => {
       return HttpResponse.json({
         choices: [{ message: { content: JSON.stringify({ /* mock data */ }) } }]
       })
     })
   )
   
   beforeAll(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())
   ```

3. **File System Mocks**: For CLI tests that interact with the file system
   ```typescript
   import { vol } from 'memfs'
   
   vi.mock('fs/promises', async () => {
     const memfs = await import('memfs')
     return {
       ...memfs.fs.promises,
       // Customize as needed
     }
   })
   
   beforeEach(() => {
     vol.reset()
     vol.fromJSON({
       '/test/file.md': '# Test File\nContent here',
     })
   })
   ```

## Fixture Management

1. **Factory Functions**: Create reusable factory functions for test data
   ```typescript
   // fixtures/tags.ts
   export function createTagSet(overrides = {}) {
     return {
       year: '2023',
       lifeArea: 'learning',
       topicalTags: [{ domain: 'software-development' }],
       conversationType: 'practical',
       ...overrides
     }
   }
   ```

2. **Test Data Files**: Store larger test fixtures as JSON or Markdown files
   ```
   src/core/tagging/__tests__/fixtures/
   ├── conversations/
   │   ├── practical-software.md
   │   └── theoretical-philosophy.md
   └── expected-outputs/
       ├── practical-software.json
       └── theoretical-philosophy.json
   ```

3. **Snapshot Testing**: Use snapshots for complex output validation
   ```typescript
   test('correctly classifies practical software conversation', async () => {
     const content = await readFixture('conversations/practical-software.md')
     const result = await taggingService.classifyContent(content)
     expect(result).toMatchSnapshot()
   })
   ```

## Integration Tests

- Cross-component integration testing
- API interaction testing with MSW or similar mocking tools
- File system operation testing with memfs
- CLI execution testing with execa or similar tools

## End-to-End Tests

- CLI workflow testing with real file system operations (in CI)
- Plugin installation and operation testing in Obsidian test environment
- Extension activation and operation testing in VS Code test harness
- Real OpenAI API testing with controlled inputs (optional, environment-gated)

## Performance Testing

- Token usage optimization testing
- Processing time benchmarking with Vitest's benchmark mode
- Memory usage profiling
- Load testing for concurrent operations

## Vitest Configuration

We use a dedicated `vitest.config.ts` file that extends our main Vite configuration:

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/mocks/**'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80
      }
    },
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks', // Use 'threads' for browser tests
    isolate: true
  }
}))
```

## Testing Best Practices

1. **Coverage Goals**:
   - Aim for >80% coverage of core business logic
   - Prioritize critical path coverage
   - Include edge cases and error conditions

2. **Test Organization**:
   - Co-locate tests with the code they test
   - Follow AAA pattern (Arrange, Act, Assert)
   - Use descriptive test names that read as specifications

3. **Test Data Management**:
   - Use factory functions for consistent test data
   - Store complex fixtures as separate files
   - Leverage TypeScript for type-safe test data

4. **Mocking Strategy**:
   - Use dependency injection for easier mocking
   - Create reusable mock factories
   - Mock external services consistently
   - Prefer interface mocking over implementation mocking

5. **CI Integration**:
   - Run tests on all pull requests
   - Include performance benchmarks
   - Track coverage over time
   - Use test matrices for different environments 