# Common Linter Errors in Obsidian Magic Project

This document summarizes recurring linter errors that have been encountered in the Obsidian Magic project, categorizing
them by type and providing potential solutions to avoid them in the future.

## TypeScript Type Safety Issues

### 1. Untyped Variables and Parameters

- **Error Pattern**: Using parameters without explicit types
- **Example**:
  ```typescript
  function processData(data) {
    /* ... */
  }
  // Should be:
  function processData(data: DataType) {
    /* ... */
  }
  ```
- **Solution**: Always provide explicit types for function parameters, especially in mock implementations.

### 2. Unused Parameters in Arrow Functions

- **Error Pattern**: Defining parameters that aren't used, especially in mock functions
- **Example**:
  ```typescript
  vi.fn(
    (name: string): OutputChannel => ({
      /* ... */
    })
  );
  ```
- **Solution**: Prefix unused parameters with underscore to indicate intent: `(_name: string)`

### 3. Any Type Usage

- **Error Pattern**: Using `any` explicitly or implicitly
- **Example**:
  ```typescript
  const data = getDataFromSomewhere(); // Implicit any
  ```
- **Solution**: Define proper interfaces and types; use `unknown` with type guards when necessary.

### 4. Type Assertions Without Validation

- **Error Pattern**: Using type assertions without proper validation
- **Example**:
  ```typescript
  return data as ValidData;
  ```
- **Solution**: Use type guards to validate before asserting or use `unknown` with validation.

### 5. Unsafe Return Types

- **Error Pattern**: Returning a value of type `error` without proper typing
- **Example**:
  ```typescript
  // TypeScript flags: Unsafe return of a value of type error.
  return OpenAIClient.getInstance().calculateCost(model, inputTokens, outputTokens);
  ```
- **Solution**: Ensure the singleton pattern is properly implemented or instantiate the class directly.

### 6. Exact Optional Property Type Errors

- **Error Pattern**: Type incompatibility with `exactOptionalPropertyTypes: true` compiler flag
- **Example**:
  ```typescript
  // Error: Type '{ props... vaultPath: undefined; }' is not assignable to type 'Config'
  // Types of property 'vaultPath' are incompatible.
  // Type 'undefined' is not assignable to type 'string'.
  const config = { /* properties */ vaultPath: undefined };
  ```
- **Solution**: Either use type assertion, make properties optional in the interface, or provide null as a valid value.

## Import/Export Issues

### 1. Incorrect Import Paths

- **Error Pattern**: Importing from incorrect paths, especially when using package-level exports
- **Example**:
  ```typescript
  import { Tag } from '@obsidian-magic/core/models/tags';
  // When it should be:
  import { Tag } from '@obsidian-magic/core';
  ```
- **Solution**: Ensure packages correctly export and re-export types in their index.ts files.

### 2. Unused Imports

- **Error Pattern**: Importing modules or types that aren't used
- **Solution**: Regular code cleanup to remove unused imports; use lint-staged to catch these during commits.

### 3. Missing Type Imports

- **Error Pattern**: Not using `import type` for type-only imports
- **Example**:
  ```typescript
  import { Tag } from './models';
  // Should be:
  import type { Tag } from './models';
  ```
- **Solution**: Consistently use `import type` for all type-only imports.

### 4. Non-existent Module References

- **Error Pattern**: Referencing a module that can't be found
- **Example**:
  ```typescript
  // Error: Cannot find module '@obsidian-magic/core/utils/Object'
  import { deepMerge } from '@obsidian-magic/core/utils/Object';
  ```
- **Solution**: Check for correct case sensitivity in file paths; many issues occur from capitalization mismatches.

## Test-Specific Issues

### 1. Unbound Method References

- **Error Pattern**: Using class methods as values without proper binding
- **Example**:
  ```typescript
  expect(mockObj.method).toHaveBeenCalled();
  ```
- **Solution**: Use one of these approaches:

  ```typescript
  // Direct property access to mock metrics
  expect(mockObj.method.mock.calls.length).toBeGreaterThan(0);

  // Store reference first
  const method = mockObj.method;
  expect(method).toHaveBeenCalled();

  // Use vi.mocked to properly type the mock
  expect(vi.mocked(mockObj.method)).toHaveBeenCalled();
  ```

### 2. Incorrect Mock Setup

- **Error Pattern**: Mock implementations not returning the right type or having incomplete interface coverage
- **Example**:
  ```typescript
  vi.mock('@obsidian-magic/core', () => ({
    // Missing methods or incorrect return types
  }));
  ```
- **Solution**: Create typed mock factories and define interfaces for mocks.

### 3. Accessing Mock Properties Incorrectly

- **Error Pattern**: Incorrect access to mock results/instances
- **Example**:
  ```typescript
  expect(Constructor.mock.results[0].value.method).toHaveBeenCalled();
  ```
- **Solution**: Use vi.mocked properly:
  ```typescript
  const instance = vi.mocked(Constructor).mock.instances[0];
  expect(instance.method).toHaveBeenCalled();
  ```

### 4. Missing Yargs Command Arguments

- **Error Pattern**: Incomplete Yargs command arguments in tests
- **Example**:
  ```typescript
  // Error: Argument of type '{ format: string; }' is not assignable to parameter
  // of type 'ArgumentsCamelCase<{}>'
  await handlerFn({ format: 'pretty' });
  ```
- **Solution**: Include required Yargs properties in test arguments:
  ```typescript
  await handlerFn({
    format: 'pretty',
    _: [], // Required by Yargs
    $0: 'test', // Required by Yargs
  });
  ```

## Null/Undefined Handling

### 1. Optional Chaining Omission

- **Error Pattern**: Not using optional chaining when accessing potentially undefined properties
- **Example**:
  ```typescript
  const name = obj.user.name; // Error if user is undefined
  ```
- **Solution**: Use optional chaining consistently: `obj.user?.name`

### 2. Missing Null Checks

- **Error Pattern**: Not checking for null/undefined values before operations
- **Example**:
  ```typescript
  const leaf = plugin.app.workspace.getRightLeaf();
  expect(leaf.setViewState).toHaveBeenCalledWith({
    /* ... */
  });
  ```
- **Solution**: Always add proper null checks:
  ```typescript
  const leaf = plugin.app.workspace.getRightLeaf();
  if (leaf) {
    expect(leaf.setViewState).toHaveBeenCalledWith({
      /* ... */
    });
  }
  ```

## Mock Implementation Issues

### 1. Inconsistent Mock Implementation

- **Error Pattern**: Different mocking approaches used for the same module in different files
- **Solution**: Create shared mock files that can be imported consistently.

### 2. Incomplete Mock Types

- **Error Pattern**: Mock functions returning incomplete objects or lacking proper typing
- **Solution**: Define interfaces for mock returns, use `as unknown as Type` for complex mocks.

## Best Practices for Avoiding Linter Errors

1. **Consistent Import Structure**:

   - Group imports by source (node built-ins, third-party, project, relative)
   - Keep type imports separate with `import type`

2. **Explicit Return Types**:

   - Always specify return types for functions, especially complex ones or promises

3. **Proper Mock Typing**:

   - Create typed mock factories for complex objects
   - Use `vi.mocked()` when accessing mock properties

4. **Avoid Silencing Errors**:

   - Don't use `// @ts-ignore` or `// eslint-disable`; fix the root issue

5. **Consistent Null Handling**:

   - Use optional chaining and nullish coalescing operators
   - Add explicit checks before using potentially undefined values

6. **Shared Mocks**:

   - Create centralized mock files for common dependencies
   - Export typed mock factories rather than recreating mocks in each test

7. **Regular Linting**:

   - Run lint checks before committing, using git hooks
   - Fix errors immediately rather than letting them accumulate

8. **Case Sensitivity Awareness**:

   - Be careful with file paths, especially between Windows and Unix systems
   - Maintain consistent naming conventions for files and folders

9. **Proper Error Handling**:
   - Use the Result pattern consistently throughout the codebase
   - Follow the canonical error implementation from the core package

By addressing these common issues, we can maintain a cleaner codebase with fewer linter errors and improve overall code
quality.

## Async/Promise Handling

### 1. Awaiting Non-Promise Values

- **Error Pattern**: Using `await` on functions that don't return Promises
- **Example**:
  ```typescript
  // Error: Unexpected await of a non-Promise (non-"Thenable") value
  await writeFile('file.txt', 'content'); // Using fs instead of fs/promises
  ```
- **Solution**: Use the Promise-based variants from fs/promises or util.promisify:

  ```typescript
  import { writeFile } from 'fs/promises';

  await writeFile('file.txt', 'content');
  ```

### 2. Missing Proper Promise Handling

- **Error Pattern**: Not properly handling Promise rejections
- **Example**:
  ```typescript
  someAsyncFunction(); // Promise ignored
  ```
- **Solution**: Either await the Promise or handle rejections:
  ```typescript
  await someAsyncFunction();
  // Or
  someAsyncFunction().catch(handleError);
  ```

### 3. Duplicate Implementation Conflicts

- **Error Pattern**: Having multiple implementations of the same functionality (e.g., Result pattern) across packages
- **Solution**: Consolidate implementations into a single shared library and ensure all packages reference it.
