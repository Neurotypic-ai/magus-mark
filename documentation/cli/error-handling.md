# CLI Error Handling

The CLI implements a robust error handling approach by leveraging the unified error system from the core package while
providing CLI-specific error handling.

## Core Error System Integration

The CLI imports all error classes and utilities from the core package:

```typescript
import {
  APIError,
  AppError,
  ConfigurationError,
  CostLimitError,
  ErrorCodes,
  FileSystemError,
  NetworkError,
  Result,
  ResultObject,
  ValidationError,
  failure,
  success,
  tryCatch,
  withRetry,
} from '@obsidian-magic/core/src/errors';

import type { ErrorCode } from '@obsidian-magic/core';
```

## CLI-specific Error Handling

The CLI extends the core error handling with CLI-specific patterns:

### Error Visualization

The CLI provides rich error visualization with colorized output:

```typescript
import chalk from 'chalk';

// CLI-specific error handler
function handleCliError(error: unknown): never {
  const appError = toAppError(error);

  // Format message based on error type
  if (appError instanceof ValidationError) {
    console.error(chalk.red('Error:'), appError.message);
    console.error(chalk.yellow('Tip:'), 'Use --help to see valid options');
  } else if (appError instanceof APIError) {
    console.error(chalk.red('API Error:'), appError.message);
    if (appError.statusCode === 401) {
      console.error(chalk.yellow('Tip:'), 'Check your API key');
    } else if (appError.statusCode === 429) {
      console.error(chalk.yellow('Tip:'), 'Rate limited. Try again later or reduce concurrency');
    }
  } else if (appError instanceof CostLimitError) {
    console.error(chalk.red('Cost Limit Exceeded:'), appError.message);
    if (appError.context && 'cost' in appError.context && 'limit' in appError.context) {
      console.error(chalk.yellow('Info:'), `Cost: ${appError.context.cost}, Limit: ${appError.context.limit}`);
    }
  } else {
    console.error(chalk.red(`${appError.name}:`), appError.message);
    if (process.env.DEBUG) {
      console.error(appError.format());
    }
  }

  process.exit(1);
}
```

### Command-Line Validation

The CLI integrates error handling with Yargs for command validation:

```typescript
import { ValidationError } from '@obsidian-magic/core';
import yargs from 'yargs';

yargs
  .option('concurrency', {
    type: 'number',
    describe: 'Number of parallel operations',
    default: 3,
    check: (value) => {
      if (value < 1) {
        throw new ValidationError('Concurrency must be at least 1', {
          field: 'concurrency',
        });
      }
      return true;
    },
  })
  .option('max-cost', {
    type: 'number',
    describe: 'Maximum budget for this run',
    check: (value) => {
      if (value <= 0) {
        throw new ValidationError('Max cost must be greater than 0', {
          field: 'max-cost',
        });
      }
      return true;
    },
  })
  .fail((msg, err) => {
    if (err) {
      handleCliError(err);
    } else {
      handleCliError(new ValidationError(msg));
    }
  });
```

### Safe File Operations

The CLI implements safe file operations with proper error handling:

```typescript
import { FileSystemError, Result, tryCatch } from '@obsidian-magic/core';
import fs from 'fs-extra';

async function safelyProcessFile(filePath: string, options: ProcessOptions): Promise<Result<ProcessResult>> {
  // Verify file exists
  const fileExists = await tryCatch(async () => {
    return await fs.pathExists(filePath);
  });

  if (fileExists.isOk() && !fileExists.getValue()) {
    return Result.fail(
      new FileSystemError(`File not found: ${filePath}`, {
        code: ErrorCodes.FILE_NOT_FOUND,
        path: filePath,
      })
    );
  }

  // Check permissions
  const fileAccess = await tryCatch(async () => {
    await fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  });

  if (fileAccess.isFail()) {
    return Result.fail(
      new FileSystemError(`Insufficient permissions for file: ${filePath}`, {
        code: ErrorCodes.INSUFFICIENT_PERMISSIONS,
        path: filePath,
        cause: fileAccess.getError(),
      })
    );
  }

  // Backup file before processing if requested
  if (options.backup) {
    const backupResult = await tryCatch(async () => {
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
      return backupPath;
    });

    if (backupResult.isFail()) {
      return Result.fail(
        new FileSystemError(`Failed to create backup: ${filePath}`, {
          cause: backupResult.getError(),
          path: filePath,
        })
      );
    }
  }

  // Process file
  return await tryCatch(async () => {
    return await processFile(filePath, options);
  });
}
```

### Batch Processing

The CLI handles errors during batch processing:

```typescript
import { AppError, Result } from '@obsidian-magic/core';

type BatchResult = {
  results: ProcessResult[];
  errors: Array<{ file: string; error: AppError }>;
  success: number;
  failed: number;
  total: number;
};

async function processBatch(files: string[], options: ProcessOptions): Promise<BatchResult> {
  const results: ProcessResult[] = [];
  const errors: Array<{ file: string; error: AppError }> = [];

  for (const file of files) {
    const result = await safelyProcessFile(file, options);

    if (result.isOk()) {
      results.push(result.getValue());
    } else {
      errors.push({
        file,
        error:
          result.getError() instanceof AppError
            ? (result.getError() as AppError)
            : new AppError(result.getError().message),
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
}
```

### Cost Management

The CLI implements cost management with dedicated error handling:

```typescript
import { CostLimitError } from '@obsidian-magic/core';

class CostManager {
  private totalCost = 0;
  private readonly budget?: number;

  constructor(options: { budget?: number }) {
    this.budget = options.budget;
  }

  async trackCost<T>(operation: () => Promise<T>, estimatedCost: number): Promise<T> {
    // Check if operation would exceed budget
    if (this.budget !== undefined && this.totalCost + estimatedCost > this.budget) {
      throw new CostLimitError(`Operation would exceed budget (${this.totalCost + estimatedCost} > ${this.budget})`, {
        cost: this.totalCost + estimatedCost,
        limit: this.budget,
      });
    }

    const result = await operation();
    this.totalCost += estimatedCost;
    return result;
  }
}
```

### Session Recovery

The CLI provides session recovery for interrupted operations:

```typescript
import os from 'os';
import path from 'path';

import { Result, ValidationError, tryCatch } from '@obsidian-magic/core';
import fs from 'fs-extra';

interface SessionState {
  id: string;
  queue: Array<{
    file: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
  }>;
  startedAt: string;
  lastUpdated: string;
}

async function saveSessionState(sessionId: string, state: SessionState): Promise<Result<void>> {
  return await tryCatch(async () => {
    const sessionDir = path.join(os.homedir(), '.tag-conversations', 'sessions');
    await fs.mkdir(sessionDir, { recursive: true });

    const sessionFile = path.join(sessionDir, `${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify(state, null, 2));
  });
}

async function loadSessionState(sessionId: string): Promise<Result<SessionState | null>> {
  return await tryCatch(async () => {
    const sessionFile = path.join(os.homedir(), '.tag-conversations', 'sessions', `${sessionId}.json`);

    try {
      const data = await fs.readFile(sessionFile, 'utf8');
      return JSON.parse(data) as SessionState;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null; // Session doesn't exist
      }
      throw error;
    }
  });
}

async function resumeSession(sessionId: string, options: ProcessOptions): Promise<Result<void>> {
  const stateResult = await loadSessionState(sessionId);

  if (stateResult.isFail()) {
    return Result.fail(stateResult.getError());
  }

  const state = stateResult.getValue();
  if (!state) {
    return Result.fail(new ValidationError(`Session not found: ${sessionId}`));
  }

  // Restore queue state
  const remainingFiles = state.queue
    .filter((item) => item.status === 'pending' || item.status === 'failed')
    .map((item) => item.file);

  if (remainingFiles.length === 0) {
    console.log('No remaining files to process in this session.');
    return Result.ok(undefined);
  }

  console.log(`Resuming session with ${remainingFiles.length} remaining files...`);

  // Process remaining files
  const result = await processBatch(remainingFiles, {
    ...options,
    sessionId,
  });

  console.log(`Processed ${result.success} files successfully, ${result.failed} failed.`);
  return Result.ok(undefined);
}
```

## Exit Handling

The CLI implements clean shutdown with proper exit handlers:

```typescript
function setupExitHandlers(cleanup: () => Promise<void>): void {
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
    console.error('Uncaught exception:', error instanceof AppError ? error.format() : error);
    handleExit('UNCAUGHT EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    handleExit('UNHANDLED REJECTION');
  });
}
```

## Error Logging

The CLI provides structured error logging:

```typescript
import { AppError } from '@obsidian-magic/core';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

function logError(error: unknown, context?: Record<string, unknown>): void {
  const appError =
    error instanceof AppError ? error : new AppError(error instanceof Error ? error.message : String(error));

  logger.error({
    err: {
      message: appError.message,
      name: appError.name,
      code: appError.code,
      stack: appError.stack,
      recoverable: appError.recoverable,
      context: appError.context,
    },
    ...context,
  });
}
```
