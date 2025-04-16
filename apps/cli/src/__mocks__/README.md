# CLI Test Mocks

This directory contains local test mocks for the CLI application.

## Available Mocks

### Logger Mock

The Logger mock provides a consistent way to mock the Logger from `@obsidian-magic/core/utils/Logger` in tests.

#### Usage

```typescript
// Import the mock

// Import Logger after setup
import { Logger } from '@obsidian-magic/core/utils/Logger';

import { mockLoggerInstance, setupLoggerMock } from './__mocks__/Logger';

// Set up the mock at module level
setupLoggerMock();

describe('My Test', () => {
  it('should log messages', () => {
    const logger = Logger.getInstance('test');
    logger.info('Test message');

    // Assert using the mock instance
    expect(mockLoggerInstance.info).toHaveBeenCalledWith('Test message');
  });
});
```

## Future Plans

These local mocks will eventually be moved to the shared `@obsidian-magic/testing` package for use across all packages
and applications.
