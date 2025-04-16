# Dependency Injection

The system uses a lightweight dependency injection approach based on interfaces, implementation classes, and factory
functions to promote modularity and testability.

## Core Principles

- **Service Interfaces**: Defined in shared `packages/types` or relevant package types.
- **Implementation Classes**: Reside in respective modules (`packages/core`, `apps/*`).
- **Factory Functions**: Create service instances, managing dependencies.
- **Configuration Injection**: Pass configuration objects (e.g., from `packages/core/src/config`) to services for
  flexible behavior.

## Implementation Example

```typescript
// Service interface defined in packages/types

// Implementation in packages/core

// Factory function potentially in packages/core or calling application
import { AppError, Result, createOpenAIService } from '@obsidian-magic/core';

import type { OpenAIService } from '@obsidian-magic/core';
import type { TagClassification, TagSet, TaggingConfig } from '@obsidian-magic/types';

export interface TaggingService {
  classifyContent(content: string): Promise<Result<TagClassification>>;
  applyTags(filePath: string, tags: TagSet): Promise<Result<void>>;
}

class OpenAITaggingService implements TaggingService {
  constructor(
    private openaiService: OpenAIService,
    private config: TaggingConfig
  ) {}

  async classifyContent(content: string): Promise<Result<TagClassification>> {
    // Implementation using openaiService and config
    // ... returns Result.ok or Result.fail
    return Result.ok(/* classification */);
  }

  async applyTags(filePath: string, tags: TagSet): Promise<Result<void>> {
    // Implementation using config
    // ... returns Result.ok or Result.fail
    return Result.ok(undefined);
  }
}

export function createTaggingService(config: TaggingConfig): TaggingService {
  // Factory functions resolve dependencies
  const openaiService = createOpenAIService(config.openai);
  return new OpenAITaggingService(openaiService, config);
}
```

## DI Best Practices

1. **Interface Design**:

   - Design interfaces around capabilities (what it does), not implementations (how it does it).
   - Keep interfaces cohesive and focused (Interface Segregation Principle).
   - Use generic types for reusability where appropriate.

2. **Service Implementation**:

   - Implement services that follow the Single Responsibility Principle.
   - Avoid tight coupling between concrete service implementations; depend on interfaces.
   - Favor composition over inheritance.

3. **Factory Functions**:

   - Use factory functions to encapsulate the creation logic and dependency resolution for complex services.
   - Handle the construction of the entire dependency tree within factories or composition roots (e.g., in the main
     application entry point).
   - Provide sensible defaults for optional dependencies or configuration.

4. **Configuration Management**:

   - Pass specific, validated configuration objects or values needed by the service, not the entire application config.
   - Utilize the configuration management system in `packages/core` for loading and validating configuration.
   - Validate configurations at service creation time (fail fast).

5. **Testing Considerations**:
   - Design services such that dependencies can be easily mocked or replaced with test doubles.
   - Inject dependencies (interfaces) via constructors or factory functions.
   - Utilize the `@obsidian-magic/testing` package for shared mocks (like `createMockOpenAIService`) and factories.
