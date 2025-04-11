# Command Line Tool Overview

The CLI component of Obsidian Magic provides a robust command-line interface for batch processing of conversation files, with advanced cost management and intelligent workflow orchestration.

## Key Features

- Process individual files or directories of conversations with a single command
- Smart detection of existing tags in frontmatter
- Multiple processing modes for different workflows
- Advanced cost estimation and management
- Intelligent model selection and fallback mechanisms
- Comprehensive benchmarking capabilities
- Sophisticated workflow orchestration
- Rich command-line interface with Yargs integration

## Architecture

The CLI tool uses a carefully selected set of high-quality dependencies to balance functionality with maintainability:

### Core Technologies

- **TypeScript**: Fully typed implementation with strict mode enabled
- **Node.js**: Modern ESM modules with Node 18+ features
- **OpenAI SDK**: Latest official SDK for API integrations

### Essential Dependencies

- **yargs**: Command line argument parsing with interactive menus and command grouping
- **dotenv**: Environment variable management with support for different environments
- **ora**: Terminal spinners for async operations
- **cli-progress**: Progress bars for batch operations
- **chalk**: Terminal styling for improved readability
- **boxen**: Information boxes for statistics display
- **conf**: Typed configuration storage for persisting settings
- **tokenizers**: Accurate token counting for OpenAI models
- **zod**: Runtime validation of configurations and API responses
- **inquirer**: Interactive command-line prompts for guided workflows
- **cosmiconfig**: Configuration discovery and loading from multiple sources
- **fs-extra**: Extended file system operations for robust file handling

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