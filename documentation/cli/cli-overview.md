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

# Limit processing cost
tag-conversations tag ./conversations/ --max-cost=5.00

# Use a specific model
tag-conversations tag ./conversations/ --model=gpt-4

# Run a benchmark
tag-conversations test --benchmark --models=gpt-3.5-turbo,gpt-4
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

Cost management is a core feature of the CLI:

- Precise token counting and cost estimation
- Real-time usage tracking during processing
- Budget controls with configurable thresholds
- Intelligent model selection based on task requirements
- Token optimization strategies for cost reduction

For more details, see the [Cost Management](./cost-management.md) documentation.

## Benchmarking System

The CLI includes a comprehensive benchmarking system:

- Performance evaluation across different models
- Accuracy metrics for classification quality
- Cost-efficiency analysis
- Detailed reporting with visualizations
- Parameter optimization tools

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