# CLI Overview

The Obsidian Magic CLI is a command-line tool for processing and tagging AI conversations in Markdown files. It's designed to work seamlessly with Obsidian vaults but can process any Markdown files containing conversation exports.

## Architecture

The CLI is built with a modular architecture:

- **Command Layer**: Yargs-based command registration and parsing
- **Service Layer**: Core business logic implementation
- **Utility Layer**: Helper functions and shared utilities
- **UI Layer**: Interactive user interface components

### Command Layer

Commands are structured using Yargs' command module pattern, with each command defined in its own file in the `commands/` directory. This separation allows for easy addition of new commands and clear organization of code.

Each command consists of:
- Command name and description
- Options and arguments definitions
- Handler function with implementation

### Service Layer

The service layer interacts with the core tagging engine from `@obsidian-magic/core`. This layer is responsible for:
- Preparing documents for tagging
- Handling API interactions
- Processing results
- Updating files with new tags

### Utility Layer

Common utilities include:
- Configuration management (`config.ts`)
- Logging and output formatting (`logger.ts`)
- Cost tracking and management (`cost-manager.ts`)
- Error handling (`errors.ts`)
- File operations (`frontmatter.ts`)
- Workflow orchestration (`workflow.ts`)

### UI Layer

The UI components provide interactive elements:
- Progress indicators
- Interactive tag editing
- Confirmation prompts
- Cost warnings and notifications

## Data Flow

1. User invokes a command with arguments
2. Command layer parses options and validates input
3. Files are identified and prepared for processing
4. Core engine processes files with OpenAI integration
5. Results are formatted according to output preferences
6. Files are updated with new tags (if not in dry-run mode)
7. Summary statistics are presented to the user

## Workflow Management

The CLI implements efficient workflow management with:
- Concurrency control for parallel processing
- Cost management to stay within budget
- Progress tracking for large batches
- Error recovery for transient failures
- Interactive feedback when needed

## Configuration

Configuration is managed through multiple layers:
1. Built-in defaults
2. Configuration files (via cosmiconfig)
3. Environment variables
4. Command-line arguments

This layered approach allows for flexible configuration while maintaining sensible defaults.

## Error Handling

The CLI implements a comprehensive error handling strategy:
- Custom error classes for different types of failures
- Graceful degradation when possible
- Clear error messages with actionable information
- Debug logging for troubleshooting
- Structured error reporting in JSON mode

## Cross-Platform Compatibility

The CLI is designed to work across:
- macOS
- Windows
- Linux

File paths, configuration storage, and terminal interactions are all implemented with cross-platform compatibility in mind.

## Key Features

- Process individual files or directories of conversations with a single command
- Smart detection of existing tags in frontmatter
- Multiple processing modes for different workflows
- Advanced cost estimation and management
- Intelligent model selection and fallback mechanisms
- Comprehensive benchmarking capabilities
- Sophisticated workflow orchestration
- Rich command-line interface with Yargs integration

## Command Structure

The CLI implements a hierarchical command structure with nested subcommands:

```bash
# Main command groups
tag-conversations tag      # Process and tag conversations
tag-conversations test     # Run tests and benchmarks
tag-conversations config   # Manage configuration
tag-conversations stats    # View statistics and reports
tag-conversations taxonomy # Manage taxonomy
```

Each command group contains specialized subcommands for specific operations:

```bash
# Example of config subcommands
tag-conversations config get [key]        # View configuration values
tag-conversations config set <key> <value> # Set configuration values
tag-conversations config import <file>     # Import configuration from file
tag-conversations config export --format=json # Export configuration to file
```

For a complete reference of all commands and their options, see the [Command Structure & Options](./command-structure.md) documentation.

## Usage Examples

The CLI implements a flexible workflow engine with multiple operating modes:

### Basic Tagging Operations

```bash
# Process a single file
tag-conversations tag ./path/to/conversation.md

# Process an entire directory recursively
tag-conversations tag ./path/to/conversations/

# Process multiple specific paths
tag-conversations tag ./path1.md ./path2.md ./directory/

# Process all files in auto mode
tag-conversations tag ./conversations/ --mode=auto

# Process only files missing tags
tag-conversations tag ./conversations/ --mode=differential

# Process files and prompt for each
tag-conversations tag ./conversations/ --mode=interactive

# Force reprocessing of all files
tag-conversations tag ./conversations/ --force
```

### Cost Management and Budget Control

```bash
# Limit processing cost with warning at 80%
tag-conversations tag ./conversations/ --max-cost=5.00

# Set action when hitting cost limit
tag-conversations tag ./conversations/ --max-cost=10.00 --on-limit=pause

# Get accurate cost estimate before processing
tag-conversations tag ./conversations/ --dry-run

# Use a specific model with cost awareness
tag-conversations tag ./conversations/ --model=gpt-4 --max-cost=15.00
```

### Advanced Testing and Benchmarking

```bash
# Run basic performance benchmark
tag-conversations test --benchmark

# Compare multiple models with detailed metrics
tag-conversations test --benchmark --models=gpt-3.5-turbo,gpt-4,gpt-4o --compare

# Run integration tests
tag-conversations test --integration

# Perform stress testing with volume control
tag-conversations test --stress-test --volume=1000 --concurrency=10

# Optimize parameters for better performance
tag-conversations test --optimize-params --parameters=confidence,concurrency

# Use specific datasets for testing
tag-conversations test --benchmark --dataset=technical --samples=50
```

### Configuration and Profile Management

```bash
# Create a configuration profile for fast processing
tag-conversations config create-profile fast-tagging --model=gpt-3.5-turbo --concurrency=5

# Switch to a different profile
tag-conversations config use-profile fast-tagging

# Validate model availability
tag-conversations config validate-model gpt-4o

# Export configuration for sharing
tag-conversations config export --format=json --output=my-config.json
```

### Statistics and Analysis

```bash
# View usage statistics for the current month
tag-conversations stats --period=month --type=all

# Analyze files in a directory for tag distribution
tag-conversations stats --directory=./conversations --format=table

# Export usage data to CSV
tag-conversations stats --period=all --output=usage-report.csv

# Reset usage statistics
tag-conversations stats --reset
```

## Workflow Orchestration

The CLI provides sophisticated workflow orchestration capabilities:

- Multiple processing modes (auto, interactive, differential)
- Concurrent processing with adaptive throttling
- Priority-based queuing system
- Resumable processing sessions
- Checkpoint system for fail-safe operation

For more details, see the [Workflow Orchestration](./workflow-orchestration.md) documentation.

## Cost Management

Cost management is a core feature of the CLI with sophisticated tracking and control mechanisms:

### Real-time Cost Tracking
- **Precise token counting**: Uses OpenAI's official tokenizer for accurate estimates
- **Live cost monitoring**: Tracks actual API usage during processing with real-time updates
- **Budget enforcement**: Configurable cost limits with automatic pausing/warning/stopping
- **Session persistence**: Maintains cost data across processing sessions

### Intelligent Estimation
- **Accurate dry-run estimates**: Per-file cost calculation using the cost manager
- **Budget comparison**: Shows estimated vs. allocated budget before processing
- **Model-specific pricing**: Handles different token rates for various models
- **Token optimization**: Suggests ways to reduce costs while maintaining quality

### Budget Controls
```bash
# Set hard limit with warning threshold
tag-conversations tag ./convos/ --max-cost=10.00 --on-limit=pause

# Get detailed cost breakdown
tag-conversations tag ./convos/ --dry-run --verbose
```

### Cost Analytics
- **Historical tracking**: Maintains detailed usage records over time
- **Model comparison**: Cost-efficiency analysis across different models
- **Usage patterns**: Identifies optimization opportunities
- **Export capabilities**: Generate cost reports for analysis

For more details, see the [Cost Management](./cost-management.md) documentation.

## Benchmarking System

The CLI includes a comprehensive benchmarking system with advanced testing capabilities:

### Performance Evaluation
- **Multi-model comparison**: Side-by-side evaluation of different AI models
- **Accuracy metrics**: Precision, recall, F1-score measurements for classification quality
- **Latency analysis**: Response time percentiles (P50, P90, P95) and averages
- **Cost-efficiency analysis**: Cost per operation and tokens per classification

### Test Types
```bash
# Standard benchmarking
tag-conversations test --benchmark --models=gpt-3.5-turbo,gpt-4,gpt-4o

# Integration testing
tag-conversations test --integration

# Stress testing with volume control
tag-conversations test --stress-test --volume=1000 --concurrency=10

# Parameter optimization
tag-conversations test --optimize-params --parameters=confidence,concurrency
```

### Built-in Test Datasets
- **Standard**: General conversation samples (~100 files)
- **Edge-case**: Challenging conversations with ambiguous topics
- **Multilingual**: Conversations in multiple languages
- **Technical**: Specialized technical conversations

### Advanced Features
- **Parameter optimization**: Systematic testing to find optimal configuration
- **Custom datasets**: Register and use your own test data
- **Report generation**: HTML, JSON, and CSV export formats
- **Model recommendations**: Automatic selection based on performance criteria
- **Continuous benchmarking**: Scheduled regular performance evaluation

### Integration & Stress Testing
- **API integration validation**: Tests OpenAI API connectivity and error handling
- **File processing pipeline**: End-to-end workflow verification
- **Performance regression**: Validates system performance under load
- **Resource monitoring**: Memory usage and processing efficiency tracking

For more details, see the [Benchmarking Capabilities](./benchmarking.md) documentation.

## Yargs Integration

The CLI is built with Yargs for a professional command-line experience:

- Type-safe command and option definitions
- Rich help documentation and usage examples
- Command middleware for cross-cutting concerns
- Advanced features like auto-completion and validation
- Interactive features with inquirer integration

For more details on the implementation, see the [Yargs Implementation](./yargs-implementation.md) documentation.

## Configuration Management

The CLI provides comprehensive configuration management:

- Environment variables with dotenv support
- Configuration files using cosmiconfig
- CLI options override configuration
- Configuration profiles for different workflows
- Import/export functionality

```bash
# Using environment variables
OPENAI_API_KEY=your-key tag-conversations tag ./conversations/

# Using configuration file
tag-conversations --config=./my-config.json tag ./conversations/

# Creating a configuration profile
tag-conversations config create-profile fast-tagging --model=gpt-3.5-turbo --concurrency=5
```

## Interactive Features

The CLI includes interactive features for a guided experience:

- Model selection with cost estimates
- Interactive tagging review and approval
- Tag editing and refinement
- Progress visualization with spinners and progress bars
- Rich terminal output with color-coding and formatting

## Installation

The CLI can be installed globally:

```bash
# Using npm
npm install -g @obsidian-magic/cli

# Using yarn
yarn global add @obsidian-magic/cli

# Using pnpm
pnpm add -g @obsidian-magic/cli
```

Or run directly using npx:

```bash
npx @obsidian-magic/cli tag ./conversations/
```

## Related Documentation

- [Command Structure & Options](./command-structure.md)
- [Workflow Orchestration](./workflow-orchestration.md)
- [Cost Management](./cost-management.md)
- [Benchmarking Capabilities](./benchmarking.md)
- [Yargs Implementation](./yargs-implementation.md)
- [Error Handling Strategies](./error-handling.md)
- [Configuration Reference](./configuration-reference.md)
- [Interactive UI Features](./interactive-ui.md)

## Related Components

- The CLI shares core tagging logic with the [Obsidian Plugin](../obsidian-plugin/plugin-overview.md)
- Model selection and API interaction are defined in [OpenAI Integration](../core/openai-integration.md) 