# Error Handling

The project implements a comprehensive error handling strategy with a consolidated approach using a shared error system
in the core package.

## Unified Error Architecture

All error handling is centralized in `packages/core/src/errors.ts`, which provides:

1. A type-safe error hierarchy with specialized error classes
2. Result patterns for handling operations that can fail
3. Utility functions for error transformation and recovery
4. Retry mechanisms with exponential backoff

This unified approach ensures consistency across all parts of the application.

## Custom Error Classes

The core error system provides specialized error classes for different failure modes:

```typescript
// Base error class with rich context support
export class AppError extends Error {
  public readonly code: string;
  public override readonly cause?: Error | undefined;
  public readonly context?: Record<string, unknown> | undefined;
  public readonly recoverable: boolean;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code ?? 'UNKNOWN_ERROR';
    this.cause = options.cause;
    this.context = options.context;
    this.recoverable = options.recoverable ?? false;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Format error with context for display or logging
  public format(): string {
    // ...implementation
  }
}

// Specialized error classes
export class ValidationError extends AppError {
  /* ... */
}
export class FileSystemError extends AppError {
  /* ... */
}
export class APIError extends AppError {
  /* ... */
}
export class NetworkError extends AppError {
  /* ... */
}
export class ConfigurationError extends AppError {
  /* ... */
}
export class TaggingError extends AppError {
  /* ... */
}
export class MarkdownError extends AppError {
  /* ... */
}
export class CostLimitError extends AppError {
  /* ... */
}
```

## Result Pattern

The error system implements two complementary result patterns:

### Class-based Result

For functions that throw exceptions, we provide a `Result` class that can be used for operations that might fail:

```typescript
// Class-based Result pattern
export class Result<T, E extends Error = Error> {
  private readonly value: T | null;
  private readonly error: E | null;

  // Create a successful result
  static ok<U>(value: U): Result<U> {
    return new Result<U, Error>(value, null);
  }

  // Create a failed result
  static fail<U, F extends Error = Error>(error: F): Result<U, F> {
    return new Result<U, F>(null, error);
  }

  // Check if result is successful
  isOk(): boolean {
    /* ... */
  }

  // Check if result has failed
  isFail(): boolean {
    /* ... */
  }

  // Get the value or throw the error
  getValue(): T {
    /* ... */
  }

  // Get the error or throw if successful
  getError(): E {
    /* ... */
  }

  // Transform the value
  map<U>(fn: (value: T) => U): Result<U, E> {
    /* ... */
  }

  // Chain operations
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    /* ... */
  }
}

// Usage example
async function classifyDocument(path: string): Promise<Result<TagSet>> {
  try {
    const content = await readFile(path);
    const tags = await taggingService.classifyContent(content);
    return Result.ok(tags);
  } catch (err) {
    return Result.fail(toAppError(err));
  }
}

// Using the result
const result = await classifyDocument('path/to/file.md');
if (result.isOk()) {
  const tags = result.getValue();
  // Use tags
} else {
  const error = result.getError();
  // Handle error
}
```

### Object-based Result

For APIs that require a simpler return structure, we provide an object-based result pattern:

```typescript
// Object-based Result interface
export interface ResultObject<T = undefined> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
    [key: string]: unknown;
  };
}

// Helper functions
export function success<T>(data?: T): ResultObject<T> {
  return { success: true, data };
}

export function failure(error: AppError | Error): ResultObject<never> {
  // Implementation that converts Error to ResultObject
}

// Usage in API
function processFile(path: string): ResultObject<FileData> {
  try {
    // Process file
    return success({ content, metadata });
  } catch (err) {
    return failure(err);
  }
}
```

## Retry Mechanisms

The error system includes robust retry logic for transient failures:

```typescript
// Retry utility with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    retryableStatusCodes?: number[];
  } = {}
): Promise<T> {
  // Implementation with exponential backoff
}

// Usage example
const data = await withRetry(() => apiClient.fetchData(id), {
  maxRetries: 3,
  initialDelay: 1000,
  factor: 2,
});
```

## Error Handling Best Practices

1. **Error Classification**:

   - Use the appropriate error type for the failure mode
   - Include context information for better debugging
   - Set the `recoverable` flag appropriately

2. **Recovery Strategies**:

   - Use `withRetry` for operations that might experience transient failures
   - Implement fallback mechanisms for critical operations
   - Preserve partial results when batch operations partially fail

3. **Contextual Information**:

   - Include relevant context in error objects
   - Use the `cause` property to maintain error chains
   - Attach relevant data through the `context` property

4. **Error Reporting**:
   - Use `error.format()` to get a detailed error string including context
   - Log structured error information for easier debugging
   - Present user-friendly error messages in UIs

## Error Utility Functions

The system includes several utility functions:

```typescript
// Convert any error to an AppError
export function toAppError(error: unknown, defaultCode = 'UNKNOWN_ERROR'): AppError;

// Try an operation and return a Result
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>>;

// Try an operation and return the value or null
export async function tryOrNull<T>(fn: () => Promise<T>): Promise<T | null>;
```

## Implementation Examples

### Using the Result Class

```typescript
import { Result, toAppError } from '@obsidian-magic/core';

async function processFile(path: string): Promise<Result<ProcessedData>> {
  try {
    // Process the file
    return Result.ok(processedData);
  } catch (error) {
    return Result.fail(toAppError(error, 'FILE_PROCESSING_ERROR'));
  }
}

// Using the result
const result = await processFile('path/to/file.md');
if (result.isOk()) {
  const data = result.getValue();
  console.log('Success:', data);
} else {
  console.error('Error:', result.getError().format());
}
```

### Using the Result Object Pattern

```typescript
import { failure, success } from '@obsidian-magic/core';

import type { ResultObject } from '@obsidian-magic/core';

function validateConfig(config: unknown): ResultObject<ValidConfig> {
  try {
    // Validate the config
    return success(validatedConfig);
  } catch (error) {
    return failure(error);
  }
}

// Using the result object
const result = validateConfig(userConfig);
if (result.success) {
  console.log('Valid config:', result.data);
} else {
  console.error('Invalid config:', result.error?.message);
}
```

### Using Retry Logic

```typescript
import { APIError, withRetry } from '@obsidian-magic/core';

async function fetchData(id: string): Promise<Data> {
  return withRetry(
    async () => {
      const response = await fetch(`/api/data/${id}`);
      if (!response.ok) {
        throw new APIError('Failed to fetch data', {
          statusCode: response.status,
          recoverable: response.status === 429 || response.status >= 500,
        });
      }
      return await response.json();
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      factor: 2,
    }
  );
}
```
