# Obsidian Magic Core

This package provides the core functionality for Obsidian Magic, including:

- AI-powered tagging and classification system
- OpenAI API integration with prompt engineering
- Markdown processing utilities
- Batch processing capabilities

## Installation

```bash
# From the project root
pnpm install @obsidian-magic/core
```

## Usage

### Basic Usage

```typescript
import { initializeCore } from '@obsidian-magic/core';

// Initialize the core module with your API key
const core = initializeCore({
  openaiApiKey: 'your-api-key',
  model: 'gpt-4o', // Default model
});

// Parse a document
const document = core.documentProcessor.parseDocument('document-id', '/path/to/document.md', markdownContent);

// Tag the document
const result = await core.taggingService.tagDocument(document);

if (result.success && result.tags) {
  // Update document with tags
  const updatedContent = core.documentProcessor.updateDocument(document, result.tags);

  // Use the updated content
  console.log(updatedContent);
}
```

### Batch Processing

```typescript
import { initializeCore } from '@obsidian-magic/core';

const core = initializeCore({
  openaiApiKey: 'your-api-key',
});

// Create a batch of documents
const documents = [
  { id: 'doc1', path: '/path/to/doc1.md', content: '...' },
  { id: 'doc2', path: '/path/to/doc2.md', content: '...' },
];

// Get cost estimate
const estimate = core.batchProcessingService.estimateBatchCost(documents);
console.log(`Estimated cost: $${estimate.estimatedCost}`);

// Process batch with progress reporting
const result = await core.batchProcessingService.processBatch(documents, {
  concurrency: 5,
  continueOnError: true,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});

// Use the results
console.log(`Successfully processed: ${result.summary.successful}`);
```

### Custom Taxonomy

```typescript
import { TaxonomyManager, initializeCore } from '@obsidian-magic/core';

// Create a custom taxonomy
const taxonomyManager = new TaxonomyManager({
  domains: ['custom-domain'],
  subdomains: {
    'software-development': ['custom-subdomain'],
    'custom-domain': ['sub1', 'sub2'],
  },
  contextualTags: ['custom-tag'],
});

// Initialize with custom taxonomy
const core = initializeCore({
  openaiApiKey: 'your-api-key',
  taxonomy: taxonomyManager.getTaxonomyForPrompt(),
});

// Continue using the core module...
```

## API Reference

### Core Module

#### `initializeCore(options)`

Initialize the core module with configuration.

**Parameters:**

- `options` - Configuration options
  - `openaiApiKey` - OpenAI API key
  - `model` - Model to use (default: 'gpt-4o')
  - `taxonomy` - Custom taxonomy for tagging

**Returns:** Object containing core components:

- `openAIClient` - OpenAI API client
- `taxonomyManager` - Taxonomy management utilities
- `taggingService` - Document tagging service
- `documentProcessor` - Markdown document processor
- `batchProcessingService` - Batch processing utilities

### Tagging

#### `TaggingService`

Service for tagging documents using AI.

**Methods:**

- `tagDocument(document)` - Tag a document with AI-generated tags
  - Returns a `TaggingResult` with success status and tags

#### `BatchProcessingService`

Service for batch processing multiple documents.

**Methods:**

- `processBatch(documents)` - Process a batch of documents
  - Returns a `BatchProcessingResult` with results and summary
- `estimateBatchCost(documents)` - Estimate the cost of processing
- `setOptions(options)` - Update batch processing options
- `getOptions()` - Get current options

#### `TaxonomyManager`

Manage the tagging taxonomy.

**Methods:**

- `getTaxonomy()` - Get the complete taxonomy
- `getTaxonomyForPrompt()` - Get taxonomy formatted for the prompt
- `addDomain(domain)` - Add a new domain
- `addSubdomain(domain, subdomain)` - Add a new subdomain
- `addContextualTag(tag)` - Add a new contextual tag
- `exportTaxonomy()` - Export taxonomy to serializable format
- `importTaxonomy(data)` - Import taxonomy from serialized format

### OpenAI Integration

#### `OpenAIClient`

Client for interacting with the OpenAI API.

**Methods:**

- `makeRequest(prompt, systemMessage, options)` - Make a request to the API
- `setApiKey(apiKey)` - Set API key
- `setModel(model)` - Set model to use
- `estimateTokenCount(text)` - Estimate token count for text

#### `PromptTemplates`

Templates for various OpenAI prompts.

**Methods:**

- `createTaggingPrompt(content, taxonomy, options)` - Create tagging prompt
- `createExtractionPrompt(content, maxTokens)` - Create extraction prompt
- `createSummaryPrompt(content)` - Create summary prompt

### Markdown Processing

#### `DocumentProcessor`

Process markdown documents.

**Methods:**

- `parseDocument(id, path, content)` - Parse a markdown document
- `updateDocument(document, tags)` - Update document with tags
- `extractContent(content)` - Extract content from markdown

#### `FrontmatterProcessor`

Process YAML frontmatter in markdown documents.

**Methods:**

- `extractFrontmatter(content)` - Extract frontmatter from markdown
- `extractTags(frontmatter)` - Extract tags from frontmatter
- `tagsToFrontmatter(tags)` - Convert tags to frontmatter format
- `updateFrontmatter(content, tags)` - Update frontmatter with tags

## Error Handling

The core module uses standardized error types for consistent error handling:

- `AppError` - Base error type
- `APIError` - API-related errors
- `TaggingError` - Tagging-related errors
- `MarkdownError` - Markdown processing errors
- `ConfigError` - Configuration errors
- `ValidationError` - Validation errors

Example error handling:

```typescript
import { AppError, initializeCore } from '@obsidian-magic/core';

try {
  const core = initializeCore({
    /* ... */
  });
  await core.taggingService.tagDocument(document);
} catch (err) {
  if (err instanceof AppError) {
    console.error(`Error: ${err.message}, Code: ${err.code}`);

    // Check if error is recoverable
    if (err.recoverable) {
      // Try recovery logic
    }
  } else {
    console.error('Unexpected error:', err);
  }
}
```

## Examples

See the `examples` directory for detailed usage examples:

- `cli-example.ts` - Example CLI application using the core module

## License

MIT
