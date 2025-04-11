# CLI Workflow Orchestration

The Obsidian Magic CLI implements a flexible workflow orchestration system that efficiently processes conversations with different strategies based on context and user preferences.

## Processing Modes

The CLI supports multiple processing modes that determine how files are handled:

```bash
# Automatic mode processes all files with minimal interaction
tag-conversations tag ./convos/ --mode=auto

# Interactive mode prompts for confirmation on each file
tag-conversations tag ./convos/ --mode=interactive

# Differential mode only processes files needing updates
tag-conversations tag ./convos/ --mode=differential
```

### Auto Mode

Auto mode processes all files without requiring user intervention:

- Processes all files sequentially or in parallel based on concurrency settings
- Applies consistent tagging based on global confidence thresholds
- Outputs summary statistics after completion
- Ideal for batch processing of large conversation collections

### Interactive Mode

Interactive mode provides a guided workflow with user decision points:

- Previews each file before processing
- Displays token usage and cost estimates per file
- Allows skipping individual files
- Provides options to review and modify suggested tags
- Supports manual tag editing for fine-tuned control

### Differential Mode

Differential mode intelligently processes only files needing updates:

- Scans frontmatter of existing files for tag presence
- Detects files with missing or incomplete tags
- Prioritizes files by modification date
- Skips already well-tagged conversations
- Provides significant time and cost savings for large repositories

## Processing Pipeline

The CLI implements a sophisticated processing pipeline for each conversation:

### Pre-processing Steps

1. **File Discovery**: Recursively scans directories for Markdown files
2. **Format Validation**: Validates file structure and frontmatter
3. **Content Extraction**: Parses conversation content for processing
4. **Token Estimation**: Calculates token counts for each file
5. **Batch Planning**: Organizes files into efficient processing batches

### Core Processing Stages

1. **Context Preparation**: Extracts relevant context from conversations
2. **Prompt Construction**: Builds optimized prompts for classification
3. **API Processing**: Submits prompts to OpenAI API with appropriate parameters
4. **Response Parsing**: Extracts structured data from API responses
5. **Validation**: Ensures classification results meet quality criteria

### Post-processing Steps

1. **Tag Application**: Updates files with new tag metadata
2. **Statistics Gathering**: Collects usage and performance metrics
3. **Report Generation**: Creates detailed processing reports
4. **Cache Management**: Updates caching system for future efficiency

## Concurrency Management

The CLI implements adaptive concurrency for optimal throughput:

```bash
# Set specific concurrency level
tag-conversations tag ./convos/ --concurrency=5

# Automatic concurrency based on system capabilities
tag-conversations tag ./convos/ --concurrency=auto
```

### Concurrency Features

- Parallel processing of multiple files within rate limits
- Adaptive throttling based on API response times
- Graceful handling of rate limiting and quota errors
- Progress tracking for concurrent operations
- Resource usage optimization based on system capabilities

## Queue Management

The processing system implements sophisticated queue management:

### Queue Features

- Priority-based processing queue with configurable ordering
- Resumable processing sessions for interrupted runs
- Checkpoint system for fail-safe operation
- Intelligent retry logic with exponential backoff
- Session persistence for long-running operations

### Queue Commands

```bash
# Resume a previously paused or failed queue
tag-conversations resume --session=latest

# View current queue status
tag-conversations queue status

# Clear all pending queue items
tag-conversations queue clear
```

## File Selection Strategies

The CLI supports sophisticated file selection patterns:

### Path Selection

```bash
# Process specific files
tag-conversations tag file1.md file2.md

# Process all files in a directory
tag-conversations tag ./convos/

# Process files matching a glob pattern
tag-conversations tag "./convos/**/*.md"

# Exclude specific patterns
tag-conversations tag "./convos/" --exclude="**/archive/**"
```

### Content-based Selection

```bash
# Process only files containing specific content
tag-conversations tag "./convos/" --contains="machine learning"

# Process files based on frontmatter conditions
tag-conversations tag "./convos/" --filter="tags.length < 3"

# Process files modified after a certain date
tag-conversations tag "./convos/" --modified-after="2023-01-01"
```

## Error Handling

The CLI implements robust error handling to ensure smooth operation:

### Error Strategies

- Graceful degradation for API failures
- Automatic retries with exponential backoff
- Detailed error logging with context
- Session recovery from checkpoint data
- Fallback models for reliability

### Error Reporting

```bash
# Enable verbose error reporting
tag-conversations tag ./convos/ --verbose-errors

# Save error logs to file
tag-conversations tag ./convos/ --error-log=errors.json
```

## Workflow Customization

The CLI supports workflow customization through configuration profiles:

### Profile Management

```bash
# Create a named workflow profile
tag-conversations profiles create fast-tagging --model=gpt-3.5-turbo --concurrency=5

# Use a saved profile
tag-conversations tag ./convos/ --profile=fast-tagging

# List available profiles
tag-conversations profiles list
```

### Custom Workflows

Create specialized workflows for different use cases:

- **Quick-scan**: Rapid classification with lower precision
- **Deep-analysis**: Thorough classification with high precision
- **Batch-optimized**: Cost-efficient processing for large collections
- **Interactive-review**: High-engagement workflow with user review steps 