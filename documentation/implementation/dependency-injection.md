# Dependency Injection

The system uses a lightweight dependency injection approach to promote modularity and testability:

## Core Principles

- Service interfaces defined in shared types
- Implementation classes in respective modules
- Factory functions for creating service instances
- Configuration injection for flexible behavior

## Implementation Example

```typescript
// Service interface in shared types
interface TaggingService {
  classifyContent(content: string): Promise<TagClassification>;
  applyTags(filePath: string, tags: TagSet): Promise<void>;
}

// Implementation in core module
class OpenAITaggingService implements TaggingService {
  constructor(
    private openaiService: OpenAIService, 
    private config: TaggingConfig
  ) {}
  
  async classifyContent(content: string): Promise<TagClassification> {
    // Implementation
  }
  
  async applyTags(filePath: string, tags: TagSet): Promise<void> {
    // Implementation
  }
}

// Factory function
function createTaggingService(config: TaggingConfig): TaggingService {
  const openaiService = createOpenAIService(config.openai);
  return new OpenAITaggingService(openaiService, config);
}
```

## DI Best Practices

1. **Interface Design**:
   - Design interfaces around capabilities, not implementations
   - Keep interfaces cohesive and focused
   - Use generic types for reusability

2. **Service Implementation**:
   - Implement services that do one thing well
   - Avoid tight coupling between services
   - Use composition over inheritance

3. **Factory Functions**:
   - Create factory functions for complex service instantiation
   - Handle dependency tree construction in factories
   - Provide sensible defaults for optional dependencies

4. **Configuration Management**:
   - Pass configuration objects to services
   - Use default configuration with override capability
   - Validate configurations at service creation time

5. **Testing Considerations**:
   - Design services to be easily mockable
   - Use interfaces for dependency swapping in tests
   - Create test doubles for each service 