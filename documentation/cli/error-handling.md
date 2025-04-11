# Error Handling Strategies

The Obsidian Magic CLI implements a robust error handling system to ensure reliability, graceful failure recovery, and clear user feedback.

## Error Handling Architecture

The CLI utilizes a multi-layered error handling approach:

### Error Categories

Errors are categorized into several distinct types:

1. **User Input Errors**: Invalid command-line arguments or configuration
2. **System Errors**: File system, network, or resource issues
3. **API Errors**: OpenAI API failures, rate limits, or authentication issues
4. **Processing Errors**: File parsing, token counting, or tag application failures
5. **Validation Errors**: Invalid data structures or unexpected response formats

### Error Hierarchy

The CLI implements a typed error hierarchy:

```typescript
// Base error class
class CliError extends Error {
  code: string;
  recoverable: boolean;
  
  constructor(message: string, code: string, recoverable = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.recoverable = recoverable;
  }
}

// Specific error types
class UserInputError extends CliError {
  constructor(message: string, code = 'INVALID_INPUT') {
    super(message, code, true);
  }
}

class ApiError extends CliError {
  statusCode?: number;
  retryAfter?: number;
  
  constructor(message: string, code = 'API_ERROR', statusCode?: number, retryAfter?: number) {
    super(message, code, statusCode ? statusCode < 500 : false);
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

// Additional error types...
```

## Command-Line Validation

The CLI performs validation at multiple levels:

### Argument Validation

Yargs provides the first level of validation:

```typescript
yargs
  .option('concurrency', {
    type: 'number',
    describe: 'Number of parallel operations',
    default: 3,
    check: (value) => {
      if (value < 1) {
        throw new UserInputError('Concurrency must be at least 1');
      }
      return true;
    }
  })
  .option('max-cost', {
    type: 'number',
    describe: 'Maximum budget for this run',
    check: (value) => {
      if (value <= 0) {
        throw new UserInputError('Max cost must be greater than 0');
      }
      return true;
    }
  });
```

### Command Middleware Validation

Additional validation occurs in command middleware:

```typescript
const validateApiCredentials = (argv: Arguments) => {
  const apiKey = argv.apiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new UserInputError(
      'OpenAI API key is required. Provide it via --api-key option or OPENAI_API_KEY environment variable',
      'MISSING_API_KEY'
    );
  }
  
  return argv;
};
```

## API Error Handling

The CLI implements sophisticated API error handling:

### Rate Limiting

```typescript
const apiCallWithRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    factor = 2,
  } = options;
  
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt > maxRetries) {
        throw error;
      }
      
      if (error instanceof ApiError && error.statusCode === 429) {
        // Use retryAfter from API if available, otherwise use exponential backoff
        const delay = error.retryAfter
          ? error.retryAfter * 1000
          : Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
        
        logWarning(`Rate limited. Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
      } else if (isTransientError(error)) {
        // Handle other transient errors
        const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
        logWarning(`Transient error. Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
      } else {
        // Non-recoverable error
        throw error;
      }
    }
  }
};
```

### Error Classification

The CLI classifies API errors for appropriate handling:

```typescript
const isTransientError = (error: any): boolean => {
  if (error instanceof ApiError) {
    // 5xx errors, network timeouts
    return (
      error.statusCode >= 500 ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET'
    );
  }
  
  // Network-related errors
  return (
    error.code === 'ENOTFOUND' ||
    error.code === 'EAI_AGAIN' ||
    error.message.includes('ECONNREFUSED')
  );
};
```

## File Processing Errors

The CLI handles file processing errors robustly:

### Safe File Operations

```typescript
const safelyProcessFile = async (
  filePath: string,
  options: ProcessOptions
): Promise<ProcessResult> => {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new FileSystemError(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
    }
    
    // Check permissions
    try {
      await fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (e) {
      throw new FileSystemError(
        `Insufficient permissions for file: ${filePath}`,
        'INSUFFICIENT_PERMISSIONS'
      );
    }
    
    // Backup file before processing if requested
    if (options.backup) {
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
    }
    
    // Process file with structured error handling
    return await processFile(filePath, options);
  } catch (error) {
    // Transform and enhance error
    if (error instanceof CliError) {
      // Add context to existing error
      error.message = `Error processing ${filePath}: ${error.message}`;
      throw error;
    } else {
      // Convert unknown error to FileProcessingError
      throw new FileProcessingError(
        `Error processing ${filePath}: ${error.message || 'Unknown error'}`,
        'FILE_PROCESSING_ERROR'
      );
    }
  }
};
```

### Batch Processing Error Handling

The CLI gracefully handles errors during batch processing:

```typescript
const processBatch = async (
  files: string[],
  options: ProcessOptions
): Promise<BatchResult> => {
  const results: ProcessResult[] = [];
  const errors: ProcessError[] = [];
  
  for (const file of files) {
    try {
      const result = await safelyProcessFile(file, options);
      results.push(result);
    } catch (error) {
      // Record error and continue with other files
      errors.push({
        file,
        error: error instanceof CliError ? error : new CliError(error.message, 'UNKNOWN_ERROR'),
      });
      
      if (options.failFast) {
        break;
      }
    }
  }
  
  return {
    results,
    errors,
    success: results.length,
    failed: errors.length,
    total: files.length,
  };
};
```

## Error Reporting

The CLI provides comprehensive error reporting:

### User-Friendly Output

```typescript
const handleError = (error: unknown): never => {
  if (error instanceof UserInputError) {
    // Format user input errors clearly
    console.error(chalk.red('Error:'), error.message);
    console.error(chalk.yellow('Tip:'), 'Use --help to see valid options and usage');
  } else if (error instanceof ApiError) {
    // Format API errors with relevant details
    console.error(chalk.red('API Error:'), error.message);
    if (error.statusCode === 401) {
      console.error(chalk.yellow('Tip:'), 'Check your API key and authentication settings');
    } else if (error.statusCode === 429) {
      console.error(chalk.yellow('Tip:'), 'You\'ve hit rate limits. Try again later or reduce concurrency');
    }
  } else if (error instanceof CliError) {
    // Format known CLI errors
    console.error(chalk.red(`${error.name}:`), error.message);
    if (error.recoverable) {
      console.error(chalk.yellow('Tip:'), 'This error may be recoverable. See error details above');
    }
  } else {
    // Format unknown errors
    console.error(chalk.red('Unexpected Error:'), error instanceof Error ? error.message : String(error));
  }
  
  // Exit with appropriate code
  process.exit(1);
};
```

### Detailed Logging

```typescript
const logError = (error: Error | string, context?: Record<string, any>): void => {
  const errorObj = error instanceof Error ? error : new Error(error);
  
  if (logger) {
    logger.error({
      msg: errorObj.message,
      error: {
        name: errorObj.name,
        stack: errorObj.stack,
        ...(errorObj instanceof CliError ? { code: errorObj.code } : {}),
      },
      context,
    });
  } else {
    // Fallback if logger not initialized
    console.error('[ERROR]', errorObj.message);
    if (context) {
      console.error('Context:', context);
    }
  }
};
```

## Graceful Degradation

The CLI implements graceful degradation for better reliability:

### Fallback Mechanisms

```typescript
const getClassificationTags = async (
  content: string,
  options: ClassificationOptions
): Promise<ClassificationResult> => {
  try {
    // Try primary model first
    return await classifyWithModel(content, options.model, options);
  } catch (error) {
    if (error instanceof ApiError && options.fallbackModel) {
      // Log the fallback
      logWarning(
        `Failed to classify with ${options.model}, falling back to ${options.fallbackModel}`
      );
      
      // Try fallback model
      return await classifyWithModel(content, options.fallbackModel, options);
    }
    
    // Re-throw if no fallback or not an API error
    throw error;
  }
};
```

### Partial Results

The CLI gracefully handles partial results:

```typescript
const summarizeBatchResults = (
  batchResult: BatchResult,
  options: ProcessOptions
): void => {
  console.log(chalk.bold('\nProcessing Summary:'));
  console.log(`✅ Successfully processed: ${batchResult.success} files`);
  
  if (batchResult.failed > 0) {
    console.log(`❌ Failed to process: ${batchResult.failed} files`);
    
    if (options.verbose) {
      // List failed files with reasons
      console.log(chalk.bold('\nFailed Files:'));
      batchResult.errors.forEach(({ file, error }) => {
        console.log(`- ${file}: ${error.message}`);
      });
    }
    
    // Offer retry option if appropriate
    if (options.interactive && batchResult.failed > 0) {
      inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'retry',
            message: 'Would you like to retry failed files?',
            default: false,
          },
        ])
        .then(async ({ retry }) => {
          if (retry) {
            const filesToRetry = batchResult.errors.map((e) => e.file);
            console.log(`Retrying ${filesToRetry.length} files...`);
            await processBatch(filesToRetry, options);
          }
        });
    }
  }
};
```

## Error Prevention

The CLI implements strategies to prevent errors:

### Preflight Checks

```typescript
const runPreflightChecks = async (
  options: ProcessOptions
): Promise<PreflightResult> => {
  const checks: PreflightCheck[] = [];
  
  // Check API credentials
  checks.push({
    name: 'API Credentials',
    run: async () => {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          success: false,
          message: 'OpenAI API key is missing',
        };
      }
      
      try {
        // Verify API key with a minimal API call
        await verifyApiKey(apiKey);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: `API key verification failed: ${error.message}`,
        };
      }
    },
  });
  
  // Check file access
  if (options.paths.length > 0) {
    checks.push({
      name: 'File Access',
      run: async () => {
        const inaccessibleFiles = [];
        
        for (const path of options.paths) {
          try {
            const stats = await fs.stat(path);
            if (stats.isDirectory()) {
              // Check if directory is readable
              await fs.access(path, fs.constants.R_OK);
            } else {
              // Check if file is readable and writable
              await fs.access(path, fs.constants.R_OK | fs.constants.W_OK);
            }
          } catch (error) {
            inaccessibleFiles.push(`${path} (${error.code})`);
          }
        }
        
        if (inaccessibleFiles.length > 0) {
          return {
            success: false,
            message: `Cannot access some files: ${inaccessibleFiles.join(', ')}`,
          };
        }
        
        return { success: true };
      },
    });
  }
  
  // Execute checks
  const results = await Promise.all(checks.map(async (check) => {
    try {
      const result = await check.run();
      return { ...check, ...result };
    } catch (error) {
      return {
        ...check,
        success: false,
        message: `Check failed: ${error.message}`,
      };
    }
  }));
  
  const allPassed = results.every((r) => r.success);
  
  return {
    passed: allPassed,
    checks: results,
  };
};
```

## Debugging Support

The CLI includes rich debugging support:

### Debug Mode

```typescript
const enableDebugMode = (argv: Arguments): void => {
  if (argv.debug) {
    // Set environment variable
    process.env.DEBUG = 'tag-conversations:*';
    
    // Configure detailed error stack traces
    Error.stackTraceLimit = Infinity;
    
    // Setup debug logging
    configureLogger('debug', true);
    
    logDebug('Debug mode enabled');
    logDebug('Command arguments:', argv);
  }
};
```

### State Dumps

```typescript
const dumpStateForDebugging = (
  state: ProcessingState,
  error: Error
): void => {
  if (!process.env.DEBUG) return;
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const debugDir = path.join(os.tmpdir(), 'tag-conversations-debug');
  
  try {
    fs.mkdirSync(debugDir, { recursive: true });
    
    const debugFile = path.join(debugDir, `error-state-${timestamp}.json`);
    
    // Sanitize state to remove sensitive information
    const sanitizedState = sanitizeStateForDump(state);
    
    // Add error details
    const debugData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof CliError ? { code: error.code } : {}),
      },
      state: sanitizedState,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };
    
    fs.writeFileSync(debugFile, JSON.stringify(debugData, null, 2));
    logDebug(`Debug state dumped to ${debugFile}`);
  } catch (e) {
    logError('Failed to dump debug state', { error: e });
  }
};
```

## Error Recovery

The CLI implements recovery mechanisms for interrupted operations:

### Session Persistence

```typescript
const saveSessionState = async (
  sessionId: string,
  state: SessionState
): Promise<void> => {
  const sessionDir = path.join(os.homedir(), '.tag-conversations', 'sessions');
  await fs.mkdir(sessionDir, { recursive: true });
  
  const sessionFile = path.join(sessionDir, `${sessionId}.json`);
  await fs.writeFile(sessionFile, JSON.stringify(state, null, 2));
};

const loadSessionState = async (
  sessionId: string
): Promise<SessionState | null> => {
  const sessionFile = path.join(
    os.homedir(),
    '.tag-conversations',
    'sessions',
    `${sessionId}.json`
  );
  
  try {
    const data = await fs.readFile(sessionFile, 'utf8');
    return JSON.parse(data) as SessionState;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Session doesn't exist
    }
    throw error;
  }
};

const resumeSession = async (
  sessionId: string,
  options: ProcessOptions
): Promise<void> => {
  const state = await loadSessionState(sessionId);
  
  if (!state) {
    throw new UserInputError(`Session not found: ${sessionId}`);
  }
  
  // Restore queue state
  const remainingFiles = state.queue.filter(
    (item) => item.status === 'pending' || item.status === 'failed'
  );
  
  if (remainingFiles.length === 0) {
    console.log('No remaining files to process in this session.');
    return;
  }
  
  console.log(`Resuming session with ${remainingFiles.length} remaining files...`);
  
  // Process remaining files
  await processBatch(
    remainingFiles.map((item) => item.file),
    {
      ...options,
      sessionId,
    }
  );
};
```

## Exit Handling

The CLI implements clean shutdown handling:

```typescript
const setupExitHandlers = (cleanup: () => Promise<void>): void => {
  let shuttingDown = false;
  
  const handleExit = async (signal: string): Promise<never> => {
    if (shuttingDown) {
      process.exit(1);
    }
    
    shuttingDown = true;
    console.log(`\n${signal} received. Cleaning up...`);
    
    try {
      await cleanup();
      console.log('Cleanup completed.');
      process.exit(0);
    } catch (error) {
      console.error('Error during cleanup:', error);
      process.exit(1);
    }
  };
  
  // Handle termination signals
  process.on('SIGINT', () => handleExit('SIGINT'));
  process.on('SIGTERM', () => handleExit('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    handleExit('UNCAUGHT EXCEPTION');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    handleExit('UNHANDLED REJECTION');
  });
};
```

## Best Practices

The CLI follows these error handling best practices:

1. **Categorize Errors**: Group errors into meaningful categories
2. **Specific Error Types**: Create specific error subclasses for different scenarios
3. **Contextual Information**: Include context in error messages
4. **User-Friendly Messages**: Present clear, actionable error messages
5. **Recovery Options**: Provide recovery mechanisms when possible
6. **Graceful Degradation**: Implement fallbacks for key functionality
7. **Detailed Logging**: Log comprehensive error information for debugging
8. **Clean Exit**: Handle exit signals properly and clean up resources
9. **Preflight Checks**: Verify conditions before processing to prevent errors
10. **Consistent Error Handling**: Apply consistent error handling patterns throughout the code 