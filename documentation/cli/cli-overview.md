# Command Line Tool Overview

The CLI component of Obsidian Magic provides a robust command-line interface for batch processing of conversation files, with advanced cost management and intelligent workflow orchestration.

## Key Features

- Process individual files or directories of conversations with a single command
- Smart detection of existing tags in frontmatter
- Multiple processing modes for different workflows
- Advanced cost estimation and management
- Intelligent model selection and fallback mechanisms
- Comprehensive benchmarking capabilities

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
```

## Detailed Features

- [Command Structure & Options](./command-structure.md)
- [Workflow Orchestration](./workflow-orchestration.md)
- [Cost Management](./cost-management.md)
- [Benchmarking Capabilities](./benchmarking.md)

## Related Components

- The CLI shares core tagging logic with the [Obsidian Plugin](../obsidian-plugin/plugin-overview.md)
- Model selection and API interaction are defined in [OpenAI Integration](../core/openai-integration.md) 