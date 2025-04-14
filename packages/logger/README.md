# Obsidian Magic Logger

This package provides consistent logging functionality across all Obsidian Magic applications and packages.

## Features

- Multiple log levels (error, warn, info, debug)
- Pretty formatting with colors and timestamps
- Support for multiple output formats (pretty, JSON, silent)
- Spinners for async operations
- Box display for important information
- Table display for structured data
- Cost and token formatting utilities

## Installation

```bash
# From the project root
pnpm install @obsidian-magic/logger
```

## Usage

```typescript
import { logger } from '@obsidian-magic/logger';

// Configure the logger
logger.configure({
  logLevel: 'info',
  outputFormat: 'pretty',
});

// Basic logging
logger.info('Processing files...');
logger.warn('Rate limit approaching');
logger.error('Failed to process file');
logger.debug('Token count: 1024');
logger.success('Operation completed successfully');

// Formatted box
logger.box('Important information', 'Note');

// Spinner for async operations
const spinner = logger.spinner('Processing...');
// ... do work ...
spinner.succeed('Done!');

// Or with convenience methods
const spinner = logger.spinner('Processing...');
try {
  // ... do work ...
  logger.succeed('Done!');
} catch (error) {
  logger.fail('Operation failed');
}

// Format values
logger.formatCost(0.0123); // "$0.0123"
logger.formatTokens(1000000); // "1,000,000"
```

## Configuration

```typescript
// Available log levels
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Logger configuration
interface LoggerConfig {
  logLevel: LogLevel;
  outputFormat: 'pretty' | 'json' | 'silent';
}

// Default configuration
const DEFAULT_CONFIG = {
  logLevel: 'info',
  outputFormat: 'pretty',
};
```
