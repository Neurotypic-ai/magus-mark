# Error Handling System

The project implements a comprehensive error handling strategy with a consolidated approach using a shared error system in the core package.

## Core Components

The error handling system is centralized in `packages/core/src/errors.ts` and consists of four main components:

1. **Type-safe error hierarchy** - Specialized error classes for different failure scenarios
2. **Result pattern** - Type-safe wrappers for operations that can fail
3. **Retry mechanisms** - Tools for handling transient failures
4. **Utility functions** - Helpers for error transformation and recovery

## Error Hierarchy

### Base Error Class

The `AppError` serves as the base class for all specialized errors. It provides:

- Error code categorization
- Error chaining with the `cause` property
- Context data storage
- Recoverability indication
- Improved error formatting

See: [Error Reference Implementation](/packages/core/src/errors.ts)

### Specialized Error Types

The system provides specialized error classes for different failure scenarios:

- `ValidationError` - For input validation failures
- `FileSystemError` - For file system operation failures
- `NetworkError` - For network communication issues
- `APIError` - For API-specific failures (includes status codes and rate limit info)
- `ApiKeyError` - For authentication issues
- `ConfigurationError` - For system configuration problems
- `MarkdownError` - For markdown processing failures
- `TaggingError` - For tagging operation failures
- `CostLimitError` - For budget/token limit exceedances

### Error Codes

The system defines a comprehensive set of error codes to ensure consistent error identification across the application:

See: [Error Codes Reference](/packages/core/src/errors.ts)

## Result Pattern

The error system implements a class-based `Result<T, E>` pattern to handle operations that might fail, providing:

- Type-safe error handling without exceptions
- Method chaining with `andThen()` and `map()`
- Consistent error handling across the application
- Clear distinction between success and failure paths

### Key Methods

- `Result.ok<T>(value)` - Create a successful result
- `Result.fail<T, E>(error)` - Create a failed result
- `result.isOk()` / `result.isFail()` - Check result status
- `result.getValue()` / `result.getError()` - Access result contents
- `result.map(fn)` - Transform the success value
- `result.mapError(fn)` - Transform the error
- `result.andThen(fn)` - Chain operations that return Results
- `result.getValueOrDefault(default)` - Get value or fallback

### Usage Example

```typescript
// Function returning a Result
async function processDocument(path: string): Promise<Result<ProcessedDocument>> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return Result.ok({
      content,
      metadata: extractMetadata(content)
    });
  } catch (err) {
    return Result.fail(
      err instanceof FileSystemError 
        ? err 
        : new FileSystemError(`Failed to process document: ${err.message}`, { 
            path, 
            cause: err instanceof Error ? err : undefined 
          })
    );
  }
}

// Using a Result
const result = await processDocument('document.md');

if (result.isOk()) {
  const document = result.getValue();
  // Use the document...
} else {
  const error = result.getError();
  console.error(`Error: ${error.format()}`);
}

// Chaining Results
const tagResult = await processDocument('document.md')
  .andThen(doc => tagDocument(doc))
  .andThen(taggedDoc => saveDocument(taggedDoc));
```

## Retry Mechanism

The system provides a `withRetry` function for handling transient failures with:

- Configurable retry count
- Exponential backoff
- Custom retry conditions
- Special handling for API rate limits
- Status code-based retry decisions

See: [Retry Mechanism Reference](/packages/core/src/errors.ts)

### Usage Example

```typescript
// Use withRetry for operations that might fail transiently
const data = await withRetry(
  () => apiClient.fetchData(), 
  {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000
  }
);
```

## Utility Functions

The system includes several utility functions for error handling:

- `toAppError(error)` - Convert any error to an AppError
- `normalizeError(error)` - Standardize error formatting
- `tryCatch(fn)` - Try an async operation and return a Result
- `tryOrNull(fn)` - Try an operation and return value or null

## Best Practices

### 1. Use Specialized Error Types

```typescript
// Instead of:
throw new Error('File not found');

// Use:
throw new FileSystemError('File not found', { 
  path: filePath,
  code: ErrorCodes.FILE_NOT_FOUND 
});
```

### 2. Maintain Error Context

```typescript
try {
  // Some operation
} catch (err) {
  throw new APIError('API request failed', {
    cause: err,
    statusCode: getStatusCode(err),
    context: { request, endpoint }
  });
}
```

### 3. Use Result for Operations That Can Fail

```typescript
function processMightFail(): Result<Value> {
  try {
    // Process
    return Result.ok(value);
  } catch (err) {
    return Result.fail(toAppError(err));
  }
}
```

### 4. Chain Operations with Results

```typescript
return fetchData()
  .andThen(data => processData(data))
  .andThen(processed => saveResult(processed));
```

### 5. Use Retry for Transient Failures

```typescript
const data = await withRetry(() => fetchDataFromApi());
```

### 6. Handle Resource Cleanup Properly

```typescript
let resource;
try {
  resource = await acquireResource();
  return Result.ok(await processResource(resource));
} catch (err) {
  return Result.fail(toAppError(err));
} finally {
  if (resource) {
    await releaseResource(resource).catch(err => {
      console.error('Failed to release resource:', err);
    });
  }
}
```

### 7. Validate Inputs Early

```typescript
function processData(input: unknown): Result<ProcessedData> {
  if (!isValidInput(input)) {
    return Result.fail(new ValidationError('Invalid input'));
  }
  
  // Process valid input
  return Result.ok(process(input));
}
```

### 8. Log Errors with Context

```typescript
try {
  // Operation
} catch (error) {
  logger.error({
    message: 'Operation failed',
    error: error instanceof AppError ? error.format() : String(error),
    context: { operationId, user, timestamp }
  });
}
```

## Implementation Examples

For detailed implementation examples, refer to these files:

- [Core Error Classes](packages/core/src/errors.ts)